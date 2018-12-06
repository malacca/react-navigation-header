import React from 'react';
import TopBar from './TopBar';
import BottomBar from './BottomBar';
import {StyleSheet, View} from 'react-native';
import {StackViewTransitionConfigs, createBottomTabNavigator, createStackNavigator, SceneView} from 'react-navigation';
import StackViewStyleInterpolator from 'react-navigation-stack/dist/views/StackView/StackViewStyleInterpolator';
import {IsAndroid, HeaderNotchHeight, HeaderFixedHeight, gestureListener, gestureBeginListener, gestureCanceledListener, gestureFinishListener, setScreensHeight} from './definition';

// Container 转场动画
let _sceenBackgroundColor = '#E9E9EF';
let _transitionDefault = 'right';
let _headerModeStyle = null;
function TransitionConfiguration(transitionProps, prevTransitionProps, isModal){
  let transition = getTransitionConfig(transitionProps);
  if (prevTransitionProps && prevTransitionProps.index > transitionProps.index) {
    transition = getTransitionConfig(prevTransitionProps);
  }
  if (transition === 'none') {
    return {
      transitionSpec: {
        duration: 0,
      }
    }
  }
  const def = transition === 'right';
  const {ModalSlideFromBottomIOS, SlideFromRightIOS} = StackViewTransitionConfigs;
  const IosTransition = !IsAndroid ? (isModal || !def ? ModalSlideFromBottomIOS : SlideFromRightIOS) :
                        (transition === 'bottom' && _headerModeStyle === 'float' ? ModalSlideFromBottomIOS : null);
  return IosTransition ? {...IosTransition, ...{
    containerStyle: {
      backgroundColor: _sceenBackgroundColor,
    }
  }} : {
    screenInterpolator: def ? forFadeFromRightAndroid : StackViewStyleInterpolator.forFadeFromBottomAndroid
  }
}
function forFadeFromRightAndroid(props) {
  const {opacity, transform} = StackViewStyleInterpolator.forFadeFromBottomAndroid(props);
  const fadeEffect = {opacity};
  if (transform) {
    const {translateY} = transform[1];
    fadeEffect.transform = [
      {translateX: translateY},
      {translateY: 0}
    ]
  }
  return fadeEffect;
}
function getTransitionConfig(transitionProps) {
  const params = transitionProps.scene.route.params || {};
  return params.transition || _transitionDefault;
}

// 创建页面路由
export function CreateNavigator(tabNavigator, StackNavigator, navigatorConfig, tabBarHandler) {
  // 自定义配置
  const {background, transition, headerMode, headerColor, headerBorder, headerTitleCenter, headerBackTitleVisible, ...tabConfigure} = navigatorConfig;
  const headerStyle = headerMode && (headerMode === 'float' || headerMode === 'screen' || headerMode === 'none') ?
                      headerMode : IsAndroid ? 'screen' : 'float';
  _headerModeStyle = headerStyle;
  if (background) {
    _sceenBackgroundColor = background;
  }
  if (transition) {
    _transitionDefault = transition;
  }
  const topBarProps = {
    headerColor, headerBorder, headerTitleCenter, headerBackTitleVisible
  };

  // android TAB 页面
  // 使用 screen 模式, 若显示 header, 常规方法是再次嵌套 StackNavigator
  // 由于采用 自定义 header 组件, 这里就没必要了, 直接 render, 可有效减少嵌套层级
  class TabScreen extends React.Component {
    shouldComponentUpdate(){
      return false;
    }
    render() {
      const key = this.props.navigation.state.routeName;
      const Screen = tabNavigator[key].screen;
      const options = Screen.navigationOptions||{};
      return <View style={styles.container}>
        <View style={styles.scenes}>
          <SceneView {...this.props} component={Screen} />
        </View>
        <TopBar mode="tabScreen" routeName={key} options={options} {...topBarProps}/>
      </View>;
    }
  }
  // 缓存 header 高度
  const ScreenHeaderHeight = {};

  // 创建 TAB 页面
  let TabRoot = null;
  const TabOptions = {};
  const tabStacks = Object.entries(tabNavigator);
  if (tabStacks.length) {
    const TabRouters = {};
    const TabConfig = {};
    tabStacks.forEach(([key, value]) => {
      const configure = {...{}, ...value};
      const screen = configure.screen;
      const options = screen.navigationOptions||{};
      delete configure.screen;
      TabRouters[key] = headerStyle === 'screen' ? TabScreen : screen;
      TabConfig[key] = configure;
      TabOptions[key] = options;
      ScreenHeaderHeight[key] = options.header === null ? null : (options.headerHeight ? options.headerHeight + HeaderNotchHeight : HeaderFixedHeight);
    });
    TabRoot = createBottomTabNavigator(TabRouters, {
      tabBarComponent: props => <BottomBar {...props} {...tabConfigure} config={TabConfig} handler={tabBarHandler}/>
    });
  }

  // stack 页面 header 高度
  Object.entries(StackNavigator).forEach(([key, value]) => {
    const options = value.navigationOptions||{};
    ScreenHeaderHeight[key] = options.header === null ? null : (options.headerHeight ? options.headerHeight + HeaderNotchHeight : HeaderFixedHeight);
  });
  setScreensHeight(ScreenHeaderHeight)

  // 创建堆栈页面
  const StackNavigatorConfig = {
    mode: 'card',
    headerMode: headerStyle,
    headerBackTitleVisible,
    TabOptions: TabOptions,
    BarOptions: (props => <TopBar {...props} {...topBarProps}/>),
    transitionConfig: TransitionConfiguration,
  };
  if (headerStyle === 'float') {
    StackNavigatorConfig.gestureListener = gestureListener;
    StackNavigatorConfig.gestureBeginListener = gestureBeginListener;
    StackNavigatorConfig.gestureCanceledListener = gestureCanceledListener;
    StackNavigatorConfig.gestureFinishListener = gestureFinishListener;
  }
  return TabRoot ? createStackNavigator({TabRoot, ...StackNavigator}, StackNavigatorConfig) :
    createStackNavigator(StackNavigator, StackNavigatorConfig);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column-reverse',
    overflow: 'hidden'
  },
  scenes: {
    flex: 1
  }
});