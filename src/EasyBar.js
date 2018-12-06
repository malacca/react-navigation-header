import React from 'react';
import {IsAndroid, HeaderHeight} from './definition';
import {Platform, StyleSheet, TouchableNativeFeedback, TouchableOpacity, View, Image, Text} from 'react-native';
import defaultBackImage from 'react-navigation-stack/dist/views/assets/back-icon.png';
const ANDROID_VERSION_LOLLIPOP = 21;

export default class EasyBar extends React.PureComponent {
  static defaultProps = {
    headerBackRipple: 'rgba(0,0,0,.32)'
  };
  _renderLeft(titleCenter) {
    const {
      lastOptions,
      goBack,
      headerBackImage,
      headerBackRipple,
      headerBackTitleVisible,
      headerBackTitleColor
    } = this.props;
    if (!lastOptions) {
      return null;
    }
    const {routeName, headerTitle, headerTitleShort} = lastOptions;
    const backTitleName = headerTitleShort||headerTitle||routeName;
    let backImage;
    if (React.isValidElement(headerBackImage)) {
      backImage = headerBackImage;
    } else {
      const source = backImage ? backImage : defaultBackImage;
      backImage = <Image source={source} style={styles.icon}/>;
    }
    const buttonProps = {
      accessible:true,
      accessibilityComponentType:"button",
      accessibilityLabel: backTitleName,
      accessibilityTraits:"button",
      testID:"header-back",
      delayPressIn:0,
    }

    if (IsAndroid && Platform.Version >= ANDROID_VERSION_LOLLIPOP && headerBackRipple !== 'none') {
      if (goBack) {
        buttonProps.onPress = () => {
          requestAnimationFrame(goBack)
        };
      }
      return <TouchableNativeFeedback {...buttonProps} background={TouchableNativeFeedback.Ripple(headerBackRipple, false)}>
        <View style={titleCenter ? styles.backFloat : styles.backFixed}>{backImage}</View>
      </TouchableNativeFeedback>;
    }

    let backText = null;
    if (!IsAndroid && !headerBackTitleVisible && backTitleName) {
      backText = <Text numberOfLines={1} style={[styles.backText, headerBackTitleColor ? {color: headerBackTitleColor} : {}]}>{backTitleName}</Text>;
    }
    if (goBack) {
      buttonProps.onPress = goBack;
    }
    return <TouchableOpacity {...buttonProps} style={titleCenter ? styles.backFloat : styles.backFixed}>
      {backImage}
      {backText}
    </TouchableOpacity>;
  }
  _renderTitle(titleCenter){
    const {routeName, headerTitle} = this.props;
    const titleName = <Text style={styles.titleName}>{headerTitle||routeName}</Text>
    if (!titleCenter) {
      return titleName;
    }
    return <View style={styles.fullTitle}>{titleName}</View>
  }
  _renderRight(){
    const {headerRight, ...props} = this.props;
    if (!headerRight) {
      return null;
    }
    return <View style={styles.headerRight}>{React.isValidElement(headerRight) ? headerRight : headerRight({...props})}</View>
  }
  render() {
    const {headerTitleCenter} = this.props;
    const titleCenter = headerTitleCenter === true || headerTitleCenter === false ? headerTitleCenter : !IsAndroid;
    const easyBar = <View style={styles.easyBar}>
      {this._renderLeft(titleCenter)}
      {this._renderTitle(titleCenter)}
      {this._renderRight()}
    </View>
    const {headerBottom, ...props} = this.props;
    if (!headerBottom) {
      return easyBar;
    }
    return <View style={styles.headerBar}>
      {easyBar}
      {React.isValidElement(headerBottom) ? headerBottom : headerBottom({...props})}
    </View>
  }
}

const backButtonStyle = {
  height:HeaderHeight,
  paddingHorizontal: 10,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'flex-start',
}
const styles = StyleSheet.create({
  headerBar:{
    width:'100%',
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  easyBar:{
    height:HeaderHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  backFixed: {
    ...backButtonStyle,
    marginRight:4,
  },
  backFloat:{
    ...backButtonStyle,
    position:'absolute',
    left:0,
    top:0,
    zIndex:2,
  },
  backText:{
    fontSize: 17,
    paddingLeft: 9,
    color: '#037aff'
  },
  icon: {
    height: IsAndroid ? 24 : 21,
    resizeMode: 'contain',
  },
  fullTitle:{
    flex:1,
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleName:{
    fontSize: IsAndroid ? 20 : 17,
    fontWeight: IsAndroid ? '500' : '600',
    color: 'rgba(0, 0, 0, .9)',
    marginHorizontal: 10
  },
  headerRight:{
    position:'absolute',
    height:HeaderHeight,
    right:0,
    top:0,
  },
});