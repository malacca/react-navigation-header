import React from 'react';
import {IsAndroid, IsIphoneX} from './definition';
import {Platform, StyleSheet, View, Image, Text, TouchableNativeFeedback, TouchableWithoutFeedback} from 'react-native';

export type TabBarOptions = {
  activeTintColor?: string,
  inactiveTintColor?: string,
  activeBackgroundColor?: string,
  inactiveBackgroundColor?: string,
  rippleDisable?: boolean,
  rippleColor?: string,
  allowFontScaling: boolean,
  badgeFont?: string,
  style: any,
  tabStyle: any,
};

type Props = TabBarOptions & {
  navigation: any,
  descriptors: any,
  jumpTo: any,
  onTabPress: any,
  getLabelText: (props: { route: any }) => any,
  getTestID: (props: { route: any }) => string,
  renderIcon: any,
  dimensions: { width: number, height: number },
  safeAreaInset: { top: string, right: string, bottom: string, left: string },
};

const majorVersion = parseInt(Platform.Version, 10);
const isIos = Platform.OS === 'ios';
const ANDROID_VERSION_LOLLIPOP = 21;
const TABBAR_DEFAULT_HEIGHT = 49;
const TABBAR_COMPACT_HEIGHT = 30;
const TABBAR_PADDING_BOTTOM = IsIphoneX ? 34 : 0;

class TouchableWithoutFeedbackWrapper extends React.Component<*> {
  render() {
    const { onPress, testID, rippleDisable, rippleColor, ...props } = this.props;
    if (!rippleDisable && !isIos && majorVersion >= ANDROID_VERSION_LOLLIPOP) {
      return (
        <TouchableNativeFeedback onPress={onPress} testID={testID} background={TouchableNativeFeedback.Ripple(
          rippleColor, true
        )}>
          <View {...props} />
        </TouchableNativeFeedback>
      );
    }
    return (
      <TouchableWithoutFeedback onPress={onPress} testID={testID}>
        <View {...props} />
      </TouchableWithoutFeedback>
    );
  }
}

class BottomBar extends React.Component<Props> {
  static defaultProps = {
    activeTintColor: '#3478f6', // Default active tint color in iOS 10
    activeBackgroundColor: 'transparent',
    inactiveTintColor: '#929292', // Default inactive tint color in iOS 10
    inactiveBackgroundColor: 'transparent',
    rippleDisable: false,
    rippleColor:'rgba(0, 0, 0, .32)',
    allowFontScaling: true,
    safeAreaInset: { bottom: 'always', top: 'never' },
  };

  constructor(props) {
    super(props);
    this.state = this.props.config;
    props.handler(this._updateBarItem.bind(this));
  }

  _updateBarItem(route, item) {
    if (route in this.state) {
      const update = {};
      update[route] = {...this.state[route], ...item};
      this.setState(update);
    }
  };

  _renderLabel = ({tabSet, focused }) => {
    const {hideLabel} = tabSet;
    if (hideLabel) {
      return null;
    }
    const {
      activeTintColor,
      inactiveTintColor,
      allowFontScaling,
    } = this.props;
    const tintColor = focused ? activeTintColor : inactiveTintColor;
    return (
      <Text
        numberOfLines={1}
        allowFontScaling={allowFontScaling}
        style={[
          styles.label,
          { color: tintColor }
        ]}
      >
        {tabSet.label}
      </Text>
    );
  };

  _renderIcon = ({tabSet, focused }) => {
    const activeOpacity = focused ? 1 : 0;
    const inactiveOpacity = focused ? 0 : 1;
    const {icon, iconSelected, hideLabel} = tabSet;
    const size = hideLabel ? TABBAR_DEFAULT_HEIGHT - 3 : TABBAR_COMPACT_HEIGHT;
    const iconWrap = {width: size, height: size};
    if (hideLabel) {
      iconWrap.marginBottom = 1.5;
    }
    return (
      <View style={[styles.iconWrapper, iconWrap]}>
        <Image style={[styles.iconImage, {opacity: activeOpacity}]} source={iconSelected}/>
        <Image style={[styles.iconImage, {opacity: inactiveOpacity}]} source={icon}/>
        {this._renderBadge(tabSet, size)}
      </View>
    );
  };

  _renderBadge = (tabSet, size) => {
    const {badge} = tabSet;
    if (!badge) {
      return null;
    }
    const {badgeFont} = this.props;
    const badgeStyle = badgeFont ? {fontFamily: badgeFont} : {};
    return <View style={[styles.iconBadge, {width: size + 14}]}>
      <View style={[styles.badgeView]}><Text style={[styles.badgeTxt, badgeStyle]} numberOfLines={1}>{badge}</Text></View>
    </View>;
  };

  render() {
    const {
      navigation,
      onTabPress,
      activeBackgroundColor,
      inactiveBackgroundColor,
      rippleDisable,
      rippleColor,
      style,
      tabStyle
    } = this.props;
    const { routes } = navigation.state;
    const tabBarStyle = [
      styles.tabBar,
      style,
    ];
    return (
      <View style={tabBarStyle} pointerEvents="box-none">
        {routes.map((route, index) => {
          const focused = index === navigation.state.index;
          const testID = this.props.getTestID({ route });
          const label = this.props.getLabelText({ route });
          const tabSet = this.state[label];
          const backgroundColor = focused ? activeBackgroundColor : inactiveBackgroundColor;
          const scene = {tabSet, focused};
          return (
            <TouchableWithoutFeedbackWrapper
              key={route.key}
              onPress={() => onTabPress({ route })}
              testID={testID}
              rippleDisable={rippleDisable}
              rippleColor={rippleColor}
              style={[
                styles.tab,
                {backgroundColor},
                tabStyle
              ]}
            >
              {this._renderIcon(scene)}
              {this._renderLabel(scene)}
            </TouchableWithoutFeedbackWrapper>
          );
        })}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  tabBar: {
    height: TABBAR_DEFAULT_HEIGHT + TABBAR_PADDING_BOTTOM,
    paddingBottom: TABBAR_PADDING_BOTTOM,
    backgroundColor: '#F8F9F9',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, .3)',
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent:'flex-end',
  },
  iconWrapper: {
    position: 'relative',
  },
  iconImage:{
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  iconBadge: {
    position: 'absolute',
    alignItems: 'flex-end',
  },
  badgeView:{
    paddingLeft:4,
    paddingRight:4,
    minWidth: 18,
    maxWidth: 30,
    height:18,
    borderRadius: 24,
    backgroundColor:'red',
    alignItems: 'center',
    justifyContent: 'center',
    overflow:'hidden',
  },
  badgeTxt:{
    fontSize:14,
    color: 'white',
    lineHeight: IsAndroid ? 20 : 22,
  },
  label: {
    height:14,
    lineHeight:14,
    fontSize: 11,
    textAlign: 'center',
    fontWeight: IsAndroid ? 'normal' : 'bold',
    marginBottom:1.5,
  },
});

export default BottomBar;
