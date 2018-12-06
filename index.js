import React from 'react';
import {StyleSheet, Animated, View} from 'react-native';
import {withNavigation} from 'react-navigation';
import {CreateNavigator} from './src/CreateNavigator';
import {HeaderHeight, HeaderNotchHeight, onScrollListener, offScrollListener, getScreensHeight} from './src/definition';

let _tabBadgeUpdateFunction = null;
function handleTabBar(cb) {
  _tabBadgeUpdateFunction = cb;
}
function updateTab(route, item) {
  if (_tabBadgeUpdateFunction) {
    _tabBadgeUpdateFunction(route, item)
  }
}
function CreateNavigatorExport(tabNavigator, StackNavigator, navigatorConfig) {
  return CreateNavigator(tabNavigator, StackNavigator, navigatorConfig, handleTabBar)
}
class ScreenBody extends React.PureComponent {
  componentWillUnmount(){
    const {navigation, animatedHeader} = this.props;
    if (animatedHeader) {
      const {state} = navigation ? navigation : {};
      const {routeName} = state;
      routeName && offScrollListener(routeName)
    }
  }
  render() {
    const {
      parentScrollComponent: Component,
      navigation,
      ...basicProps
    } = this.props;
    const {state} = navigation ? navigation : {};
    const {routeName} = state;
    const customHeaderHeight = getScreensHeight(routeName);
    if (Component === 'View') {
      const {style, ...props} = basicProps;
      if (customHeaderHeight) {
        const flattenStyles = style ? StyleSheet.flatten(style) : {};
        flattenStyles.paddingTop = customHeaderHeight + ('paddingTop' in flattenStyles ? flattenStyles.paddingTop : 0);
        props.style = flattenStyles;
      } else {
        props.style = style;
      }
      return <View {...props}/>
    }
    const {animatedHeader, onScroll, scrollEventThrottle, contentContainerStyle, ...props} = basicProps;
    if (customHeaderHeight) {
      const flattenStyles = contentContainerStyle ? StyleSheet.flatten(contentContainerStyle) : {};
      flattenStyles.paddingTop = customHeaderHeight + ('paddingTop' in flattenStyles ? flattenStyles.paddingTop : 0);
      props.contentContainerStyle = flattenStyles;
      if (animatedHeader && customHeaderHeight > HeaderHeight) {
        props.scrollEventThrottle = scrollEventThrottle||16;
        props.onScroll = onScrollListener(routeName, onScroll);
      } else {
        props.scrollEventThrottle = scrollEventThrottle;
        props.onScroll = onScroll;
      }
    } else {
      props.contentContainerStyle = contentContainerStyle;
      props.scrollEventThrottle = scrollEventThrottle;
      props.onScroll = onScroll;
    }
    return <Component {...props}/>
  }
}
const ScreenComponent = withNavigation(ScreenBody);
const Screen = {
  View: props => <ScreenComponent {...props} parentScrollComponent="View"/>,
  ScrollView: props => <ScreenComponent {...props} parentScrollComponent={Animated.ScrollView}/>,
  FlatList: props => <ScreenComponent {...props} parentScrollComponent={Animated.FlatList}/>,
  SectionList: props => <ScreenComponent {...props} parentScrollComponent={Animated.SectionList}/>,
}

module.exports = {
  CreateNavigator:CreateNavigatorExport,
  Screen,
  HeaderHeight,
  HeaderNotchHeight,
  updateTab,
};