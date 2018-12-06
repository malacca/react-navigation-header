import {Dimensions, Platform, Animated, Easing} from 'react-native';
import {supportsImprovedSpringAnimation} from 'react-navigation-stack/dist/utils/ReactNativeFeatures';

const scrollAnimated = {};
const EaseInOut = Easing.inOut(Easing.ease);
const positionAnimated = new Animated.Value(0);
const supportsImprovedSpring = supportsImprovedSpringAnimation();

let _scroll_route_name = null;
let _scroll_begain_animated = null;

let _scroll_route_prevHeight = null;
let _scroll_route_positionIndex = 0;

let _scroll_route_barHeight = 0;
let _scroll_route_beginHeight = 0;
let _scroll_route_distance = 0;

let _scroll_prev_scrollHeight = 0;
let _scroll_prev_fullHeight = 0;
let _scroll_prev_distance = 0;

const X_WIDTH = 375;
const X_HEIGHT = 812;
const XSMAX_WIDTH = 414;
const XSMAX_HEIGHT = 896;
const { height: D_HEIGHT, width: D_WIDTH } = Dimensions.get('window');

export const IsAndroid = Platform.OS !== 'ios';
export const IsIphoneX = !IsAndroid && (
  (D_HEIGHT === X_HEIGHT && D_WIDTH === X_WIDTH) ||
  (D_HEIGHT === XSMAX_HEIGHT && D_WIDTH === XSMAX_WIDTH)
);
export const HeaderHeight = IsAndroid ? 48 : 44;
export const HeaderNotchHeight = IsAndroid ? 0 : (IsIphoneX ? 44 : 20);
//export const HeaderNotchHeight = 44
export const HeaderFixedHeight = HeaderHeight + HeaderNotchHeight;


let screensHeight = {};
export function setScreensHeight(height) {
  screensHeight = height;
}
export function getScreensHeight(routeName) {
  return routeName in screensHeight ? screensHeight[routeName] : 0;
}

export function onScrollListener(routeName, callback) {
  const config = {useNativeDriver:true};
  if (callback) {
    config.listener = callback
  }
  let scrollY;
  if (routeName in scrollAnimated) {
    scrollY = scrollAnimated[routeName]
  } else {
    scrollY = new Animated.Value(0);
    scrollY.addListener(({value}) => {this._value = value});
    scrollAnimated[routeName] = scrollY;
  }
  return Animated.event([{nativeEvent: {contentOffset: {y: scrollY}}}], config)
}
export function offScrollListener(routeName) {
  routeName in scrollAnimated && delete scrollAnimated[routeName]
}
export function getScrollAnimation(routeName) {
  return routeName in scrollAnimated ? scrollAnimated[routeName] : null;
}
export function setScrollAnimation(routeName, barHeight, prevHeight, positionIndex) {
  if (routeName) {
    _scroll_route_name = routeName;
    _scroll_route_barHeight = barHeight - HeaderFixedHeight;
    _scroll_route_prevHeight = prevHeight - HeaderFixedHeight;
    _scroll_route_positionIndex = positionIndex + 1;
  } else {
    _scroll_route_name = null;
    _scroll_route_barHeight = null;
    _scroll_route_prevHeight = null;
    _scroll_route_positionIndex = 0;
  }
}
export function getPositionAnimated(scrollHeight, fullHeight) {
  _scroll_prev_scrollHeight = scrollHeight;
  _scroll_prev_fullHeight = fullHeight;
  positionAnimated.setValue(fullHeight + 1);
  return positionAnimated;
}

// stack 手势滑动开始
export function gestureBeginListener() {
  _scroll_begain_animated = _scroll_route_name && _scroll_route_name in scrollAnimated ? scrollAnimated[_scroll_route_name] : null;
  if (_scroll_begain_animated) {
    _scroll_route_beginHeight = Math.min(_scroll_route_barHeight, _scroll_begain_animated._value);
    let remainHeight = _scroll_route_barHeight - _scroll_route_beginHeight;
    if (remainHeight > _scroll_route_prevHeight) {
      _scroll_route_distance =  remainHeight - _scroll_route_prevHeight;
    } else {
      _scroll_route_distance = _scroll_route_barHeight - _scroll_route_beginHeight - _scroll_route_prevHeight;
    }
    _scroll_prev_distance = _scroll_prev_fullHeight - remainHeight - _scroll_prev_scrollHeight;
  }
}
// stack 手势滑动取消
export function gestureCanceledListener(resetToIndex, duration) {
  if (_scroll_begain_animated) {
    stopGestureAnimated(_scroll_begain_animated, _scroll_route_beginHeight, duration, _scroll_begain_animated.__isNative);
    stopGestureAnimated(positionAnimated, _scroll_prev_scrollHeight + _scroll_prev_distance, duration, true, function () {
      positionAnimated.setValue(_scroll_prev_fullHeight + 1);
    });
  }
}
// stack 手势滑动完成
export function gestureFinishListener(backFromIndex, duration) {
  if (_scroll_begain_animated) {
    startGestureAnimated(_scroll_begain_animated, _scroll_route_beginHeight + _scroll_route_distance, duration, _scroll_begain_animated.__isNative);
    startGestureAnimated(positionAnimated, _scroll_prev_scrollHeight, duration, true);
  }
}
export function gestureListener(value) {
  if (_scroll_begain_animated) {
    _scroll_begain_animated.setValue(
      _scroll_route_beginHeight + _scroll_route_distance * (_scroll_route_positionIndex - value)
    );
    positionAnimated.setValue(
      _scroll_prev_scrollHeight + _scroll_prev_distance * (1 + value - _scroll_route_positionIndex)
    );
  }
}

function stopGestureAnimated(animation, toValue, duration, useNativeDriver, cb) {
  animation.stopAnimation(() => {
    if (!IsAndroid && supportsImprovedSpring) {
      Animated.spring(animation, {
        toValue,
        stiffness: 5000,
        damping: 600,
        mass: 3,
        useNativeDriver
      }).start(cb);
    } else {
      Animated.timing(animation, {
        toValue,
        duration,
        easing: EaseInOut,
        useNativeDriver
      }).start(cb);
    }
  })
}
function startGestureAnimated(animation, toValue, duration, useNativeDriver) {
  if (!IsAndroid && supportsImprovedSpring) {
    Animated.spring(animation, {
      toValue,
      stiffness: 5000,
      damping: 600,
      mass: 3,
      useNativeDriver
    }).start();
  } else {
    Animated.timing(animation, {
      toValue,
      duration,
      easing: EaseInOut,
      useNativeDriver
    }).start();
  }
}