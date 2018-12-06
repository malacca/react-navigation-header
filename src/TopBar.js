import React from 'react';
import EasyBar from './EasyBar';
import {Dimensions, StyleSheet, Animated, View} from 'react-native';
import {HeaderHeight, HeaderNotchHeight, HeaderFixedHeight, setScrollAnimation, getScrollAnimation, getPositionAnimated} from './definition';

class TopBar extends React.PureComponent {
  constructor(props) {
    super(props);
    const {headerColor, headerBorder, headerTitleCenter, headerBackTitleVisible} = this.props;
    this._headerDefaultColor = headerColor||'#FCFCFC';
    this._headerDefaultBorder = headerBorder||'#C9C9C9';
    this._headerBackTitleVisible = headerBackTitleVisible;
    this._headerTitleCenter = headerTitleCenter;
  }
  _getSceneHeaderHeight(scene) {
    if (!scene) {
      return null;
    }
    const {animated, options} = scene;
    const {header} = options;
    if (header === null) {
      return null;
    }
    const height = options.headerHeight ? (options.headerHeight + HeaderNotchHeight) : HeaderFixedHeight;
    return animated ? height - Math.min(height - HeaderFixedHeight, animated._value) : height;
  }
  _getPrevHeaderHeight() {
    return this._getSceneHeaderHeight(this._prevScene);
  }
  _getNextHeaderHeight() {
    return this._getSceneHeaderHeight(this._nextScene);
  }
  _renderFloatBar({key, routeName, options, animated, goBack, lastOptions}) {
    const {header, ...config} = options;
    if (header === null) {
      return null;
    }
    config.routeName = routeName;
    config.lastOptions = lastOptions;
    config.goBack = goBack;
    if (!('headerTitleCenter' in config)) {
      config.headerTitleCenter = this._headerTitleCenter;
    }
    if (!('headerBackTitleVisible' in config)) {
      config.headerBackTitleVisible = this._headerBackTitleVisible;
    }
    const barContentHeight = config.headerHeight || HeaderHeight;
    const barHeight = barContentHeight + HeaderNotchHeight;
    const isPrev = this._prevScene && routeName === this._prevScene.routeName;
    const isNext = this._nextScene && routeName === this._nextScene.routeName;
    const topKey = 'top_' + (key === 'tabHeader' ? key + '_' + routeName : key);
    const visible = isPrev || isNext;

    // 如有 onScroll 缓存一个隐藏节点, 否则当再次返回页面, onScroll 事件无响应
    let scrollCache = null;
    const scrollRange = animated ? animated.interpolate({
      inputRange: [0, Math.max(0, barHeight - HeaderFixedHeight)],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    }) : null;
    if (scrollRange) {
      scrollCache = <Animated.View style={[styles.upper, {top: -100, opacity: scrollRange}]} />
    }

    // 背景节点 (只会计算 最后一或两个 header)
    let barY = null;
    let barRange = null;
    let barOpacity = null;
    let background = null;
    let headerTranslateX = null;
    let headerTranslateY = null;
    if (visible) {
      let backgroundY = 0;
      let backHeight = barHeight;
      let backgroundOpacity = null;
      const {position} = this.props;
      const inputRange = [this._positionStart, this._positionStart + 0.999, this._positionStart + 1];

      // 下层 layout
      if (isPrev) {
        const nextHeight = this._getNextHeaderHeight();
        if (scrollRange && (this._transition === 'none' || this._transition === 'bottom' || !nextHeight)) {
          backgroundY = -1 * Math.min(barHeight - HeaderFixedHeight, animated._value);
          barRange = scrollRange;
        }
        // 无切换效果
        if (this._transition === 'none') {
          headerTranslateY = -barHeight;
        }
        // 上层屏幕从下方滑入,  当前 header 向上滑走
        else if (this._transition === 'bottom') {
          const {initHeight} = this.props.layout;
          const currentHeight = barHeight - (animated ? Math.min(barHeight - HeaderFixedHeight, animated._value) : 0);
          headerTranslateY = position.interpolate({
            inputRange: [this._positionStart, this._positionStart + 1],
            outputRange: [0, initHeight],
          }).interpolate({
            inputRange: [initHeight - currentHeight, initHeight],
            outputRange: [0, -currentHeight],
            extrapolate: 'clamp',
          });
        }
        // 上层屏幕无header,  当前 header 向左滑走
        else if (!nextHeight) {
          const {initWidth} = this.props.layout;
          headerTranslateX = position.interpolate({
            inputRange: [this._positionStart, this._positionStart + 1],
            outputRange: [0, -initWidth],
          });
        }
        // 上层屏幕有 header
        else {
          const nextAnimated = this._nextScene ? this._nextScene.animated : null;
          if (!this._onMoving && nextAnimated) {
            // 上层使用了 animated header, 当前不能简单使用 position, 因为上层的 barHeight 可能发生变化
            backHeight = nextHeight > barHeight ? nextHeight : barHeight;
            const fullHeight = backHeight - HeaderFixedHeight;
            const distance = nextHeight > barHeight ? nextHeight - barHeight : 0;
            const scrollHeight = (animated ? Math.min(barHeight - HeaderFixedHeight, animated._value) : 0) + distance;
            const positionAnimated = getPositionAnimated(scrollHeight, fullHeight);
            backgroundY = positionAnimated.interpolate({
              inputRange: [0, fullHeight, fullHeight + 1],
              outputRange: [0, -fullHeight, -backHeight - 10],
            });
            if (scrollRange) {
              barRange = positionAnimated.interpolate({
                inputRange: [distance, fullHeight],
                outputRange: [0, 1],
                extrapolate: 'clamp',
              });
            } else {
              barY = positionAnimated.interpolate({
                inputRange: [distance, fullHeight],
                outputRange: [0, HeaderFixedHeight - barHeight],
                extrapolate: 'clamp',
              });
            }
          }
          else {
            // 上层屏幕固定高度, 只需根据 position 缩放当前 header 即可
            let startY, endY;
            if (nextHeight < barHeight) {
              startY = 0;
              endY = nextHeight - barHeight;
              if (!scrollRange) {
                barY = position.interpolate({
                  inputRange: [this._positionStart, this._positionStart + 1],
                  outputRange: [startY, endY],
                });
              }
            } else {
              backHeight = nextHeight;
              startY = barHeight - backHeight;
              endY = 0;
            }
            if (scrollRange) {
              const scrollHeight = Math.min(barHeight - HeaderFixedHeight, animated._value);
              startY -= scrollHeight;
              barRange = position.interpolate({
                inputRange: [this._positionStart, this._positionStart + 1],
                outputRange: [barHeight - scrollHeight, nextHeight],
              }).interpolate({
                inputRange: [HeaderFixedHeight, barHeight],
                outputRange: [1, 0],
                extrapolate: 'clamp',
              })
            }
            backgroundY = position.interpolate({
              inputRange,
              outputRange: [startY, endY, -backHeight - 10],
            });
          }
          barOpacity = position.interpolate({
            inputRange: [this._positionStart, this._positionStart + 1],
            outputRange: [1, 0],
          });
        }
      }

      // 上层 layout
      else if (isNext) {
        const prevHeight = this._getPrevHeaderHeight();
        if (scrollRange && (this._transition === 'none' || this._transition === 'bottom' || !prevHeight)) {
          barRange = scrollRange;
          backgroundY = scrollRange.interpolate({
            inputRange: [0, 1],
            outputRange: [0, HeaderFixedHeight - barHeight],
          });
        }
        // 从下方滑入, 当前 header 从底部滑入
        if (this._transition === 'bottom') {
          const {initHeight} = this.props.layout;
          headerTranslateY = position.interpolate({
            inputRange: [this._positionStart, this._positionStart + 1],
            outputRange: [initHeight, 0],
          });
        }
        // 下层屏幕无 header, 当前 header 从右滑入
        else if (!prevHeight) {
          if (this._prevScene) {
            const {initWidth} = this.props.layout;
            headerTranslateX = position.interpolate({
              inputRange: [this._positionStart, this._positionStart + 1],
              outputRange: [initWidth, 0],
            });
          } else {
            barOpacity = 0.9999;
          }
        }
        // 下层屏幕 有 header
        else {
          if (!this._onMoving && scrollRange) {
            setScrollAnimation(routeName, barHeight, prevHeight, this._positionStart);
            const distance = prevHeight > barHeight ? barHeight - prevHeight : 0;
            if (distance < 0) {
              backHeight = barHeight - distance;
              backgroundY =  animated.interpolate({
                inputRange: [distance, 0, Math.max(0, barHeight - HeaderFixedHeight)],
                outputRange: [-1, 0, 1],
                extrapolate: 'clamp',
              }).interpolate({
                inputRange: [-1, 0, 1],
                outputRange: [0, distance, distance + HeaderFixedHeight - barHeight],
              });
            } else {
              backgroundY = scrollRange.interpolate({
                inputRange: [0, 1],
                outputRange: [0, HeaderFixedHeight - barHeight],
              });
            }
            barRange = scrollRange;
          }
          else {
            let startY, endY;
            const scrollHeight = scrollRange ? Math.min(barHeight - HeaderFixedHeight, animated._value) : 0;
            if (scrollRange) {
              barRange = position.interpolate({
                inputRange: [this._positionStart, this._positionStart + 1],
                outputRange: [prevHeight, barHeight - scrollHeight],
              }).interpolate({
                inputRange: [HeaderFixedHeight, barHeight],
                outputRange: [1, 0],
                extrapolate: 'clamp',
              })
            }
            if (prevHeight > backHeight) {
              startY = 0;
              endY = backHeight - prevHeight - scrollHeight;
              backHeight = prevHeight;
            } else {
              startY = prevHeight - backHeight;
              endY = -scrollHeight;
              if (!scrollRange) {
                barY = position.interpolate({
                  inputRange: [this._positionStart, this._positionStart + 1],
                  outputRange: [startY, endY],
                })
              }
            }
            backgroundY = position.interpolate({
              inputRange,
              outputRange: [startY, endY, endY],
            });
          }
          backgroundOpacity = position.interpolate({
            inputRange,
            outputRange: [0, 1, 1],
          });
          barOpacity = position.interpolate({
            inputRange: [this._positionStart, this._positionStart + 1],
            outputRange: [0, 1],
          });
        }
      }
      // 创建 background
      const bgStyle = {
        height: backHeight,
        backgroundColor: config.headerColor||this._headerDefaultColor,
        transform: [{translateY: backgroundY}]
      };
      const bgBorder = config.headerBorder||this._headerDefaultBorder;
      if (bgBorder) {
        bgStyle.borderBottomWidth = StyleSheet.hairlineWidth;
        bgStyle.borderBottomColor = config.headerBorder||this._headerDefaultBorder;
      }
      if (backgroundOpacity) {
        bgStyle.opacity = backgroundOpacity;
      }
      background = <Animated.View style={[styles.upper, bgStyle]} />;
    } else if (scrollRange) {
      barRange = scrollRange;
    }

    // header bar 节点
    let appBar = null, custom = false;
    if (React.isValidElement(header)) {
      appBar = header;
    } else {
      const renderBar = header || (props => <EasyBar {...props} />);
      custom = !!header;
      if (custom && barRange) {
        config.animationRange = barRange;
      }
      appBar = renderBar({...config});
    }
    let barStyle = {};
    if (barOpacity) {
      barStyle.opacity = barOpacity;
    }
    if (!barY && barRange && !custom) {
      barY = barRange.interpolate({
        inputRange: [0, 1],
        outputRange: [0, HeaderFixedHeight - barHeight],
      });
    }
    if (barY !== null) {
      barStyle.height = barContentHeight;
      barStyle.transform = [{translateY:barY}];
    }
    appBar = <Animated.View pointerEvents="box-none" style={[styles.upper, barStyle]}>{appBar}</Animated.View>;

    // 组合 & 返回
    const headerProps = {
      key: topKey,
      pointerEvents: 'box-none'
    };
    // 刘海屏
    if (HeaderNotchHeight) {
      appBar = <View pointerEvents="box-none" style={[styles.headerBar, {
        height: barHeight - HeaderNotchHeight,
      }]}>{appBar}</View>
    }
    const headerStyle = [styles.upper, {
      transform: [
        {translateX: visible ? (headerTranslateX ? headerTranslateX : 0) : this._deviceWidth},
        {translateY: visible && headerTranslateY ? headerTranslateY : 0}
      ]
    }];
    if (visible && headerTranslateY && isNext) {
      headerStyle.push({
        height: barHeight,
        overflow:"hidden",
      });
    }
    headerProps.style = headerStyle;
    return <Animated.View {...headerProps}>
      {scrollCache}
      {background}
      {appBar}
    </Animated.View>
  }
  _renderFloatHeader() {
    // move start index
    setScrollAnimation(null);
    const {lastTransitionProps} = this.props;
    const goIndex = this.props.index;
    this._onMoving = !!lastTransitionProps;
    this._isBack = lastTransitionProps && lastTransitionProps.index > goIndex;
    this._positionStart = lastTransitionProps ? Math.min(goIndex, lastTransitionProps.index) : Math.max(0, goIndex - 1);
    this._transition = null;
    if (this._isBack) {
      if (lastTransitionProps && lastTransitionProps.scene.route.params && 'transition' in lastTransitionProps.scene.route.params) {
        this._transition = lastTransitionProps.scene.route.params.transition;
      }
    } else if (this.props.scene.route.params && 'transition' in this.props.scene.route.params){
      this._transition = this.props.scene.route.params.transition;
    }
    this._deviceWidth = -1 * Dimensions.get('window').width;
    // stacks
    let tabName = null;
    let lastOptions = null;
    const scenesProps = [];
    const {TabOptions = {}} = this.props;
    const TabLists = Object.entries(TabOptions);
    this.props.scenes.forEach((scene) => {
      if ('routes' in scene.route && scene.route.routes.length) {
        tabName = scene.route.routes[scene.route.index].routeName;
      } else {
        const {key, options, navigation} = scene.descriptor;
        const routeName = scene.route.routeName;
        const animated = getScrollAnimation(routeName);
        const goBack = () => {
          navigation.goBack(key);
        };
        scenesProps.push({routeName, key, options, animated, goBack, lastOptions});
        lastOptions = {...options, routeName};
      }
    });
    let index = -1;
    let tabIndex = 0;
    const stackLen = scenesProps.length;
    const tabScenes = TabLists.map(([key, options]) => {
      index = index + 1;
      if (key === tabName) {
        tabIndex = index;
        if (stackLen) {
          scenesProps[0].lastOptions = {...options, routeName:key};
        }
      }
      return {
        routeName: key,
        key: 'tabHeader',
        options: options,
        animated: getScrollAnimation(key),
        goBack: null,
        lastOptions: null,
      }
    });
    this._prevScene = null;
    this._nextScene = null;
    if (stackLen) {
      this._prevScene = stackLen > 1 ? scenesProps[stackLen - 2] : (tabScenes ? tabScenes[tabIndex] : null);
      this._nextScene = scenesProps[stackLen - 1];
    } else if (tabScenes) {
      this._nextScene = tabScenes[tabIndex];
    }
    this._headers = tabScenes.concat(scenesProps);
    return this._headers.map(this._renderFloatBar, this);
  }

  _renderScreenBar(props) {
    const {routeName, options, goBack, lastOptions} = props;
    const {header, ...config} = options;
    if (header === null) {
      return null;
    }
    config.routeName = routeName;
    config.lastOptions = lastOptions;
    config.goBack = goBack;
    if (!('headerTitleCenter' in config)) {
      config.headerTitleCenter = this._headerTitleCenter;
    }
    if (!('headerBackTitleVisible' in config)) {
      config.headerBackTitleVisible = this._headerBackTitleVisible;
    }
    const barHeight = config.headerHeight || HeaderHeight;
    const animated = getScrollAnimation(routeName);
    const scrollRange = animated ? animated.interpolate({
      inputRange: [0, Math.max(0, barHeight - HeaderHeight)],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    }) : null;
    const translateY = scrollRange ? scrollRange.interpolate({
      inputRange: [0, 1],
      outputRange: [0, HeaderHeight - barHeight],
    }) : null;
    const backgroundColor = config.headerColor||this._headerDefaultColor;
    const bgStyle = {
      backgroundColor,
      height: barHeight + HeaderNotchHeight,
    };
    if (config.headerBorder !== null) {
      bgStyle.borderBottomWidth = StyleSheet.hairlineWidth;
      bgStyle.borderBottomColor = config.headerBorder||this._headerDefaultBorder;
    }
    // header bar 节点
    let appBar = null, custom = false;
    if (React.isValidElement(header)) {
      appBar = header;
    } else {
      const renderBar = header || (props => <EasyBar {...props} />);
      custom = !!header;
      if (custom && scrollRange) {
        config.animationRange = scrollRange;
      }
      appBar = renderBar({...config});
    }
    if (!translateY) {
      if (HeaderNotchHeight) {
        appBar = <View style={[styles.headerBar, {
          height: barHeight
        }]}>{appBar}</View>;
      }
      return <View style={[styles.upper, bgStyle]}>{appBar}</View>
    }
    if (!custom) {
      appBar = <Animated.View style={[styles.upper, {
        height: barHeight,
        transform: [{translateY}],
      }]}>{appBar}</Animated.View>;
    }
    if (HeaderNotchHeight) {
      appBar = <View style={[styles.headerBar, {
        height: barHeight
      }]}  pointerEvents="box-none">{appBar}</View>;
    }
    bgStyle.transform = [{translateY}];
    return <View style={[styles.upper]}>
      <Animated.View pointerEvents="none" style={[styles.upper, bgStyle]} />
      {appBar}
    </View>
  }
  _renderScreenHeader(){
    if (this.props.mode === 'tabScreen') {
      const {routeName, options} = this.props;
      return this._renderScreenBar({routeName, options, goBack:null, lastOptions: null});
    }
    let lastRouteName, lastOptions;
    const {scene, scenes, TabOptions} = this.props;
    const {index, descriptor, route} = scene;
    const routeName = route.routeName;
    const options = descriptor.options;
    const goBack = () => {
      descriptor.navigation.goBack(descriptor.key);
    };
    const lastScene = scenes[index - 1];
    if (lastScene.route.routes) {
      lastRouteName = lastScene.route.routes[lastScene.route.index].routeName;
      lastOptions = TabOptions[lastRouteName];
    } else {
      lastRouteName = lastScene.route.routeName;
      lastOptions = lastScene.descriptor.options;
    }
    lastOptions.routeName = lastRouteName;
    return this._renderScreenBar({routeName, options, goBack, lastOptions});
  }
  render() {
    return this.props.mode === 'float' ? this._renderFloatHeader() : this._renderScreenHeader();
  }
}

const styles = StyleSheet.create({
  upper: {
    position:'absolute',
    left:0,
    right:0,
    top:0,
  },
  headerBar: {
    position:'relative',
    width:'100%',
    marginTop: HeaderNotchHeight,
    overflow: 'hidden',
  }
});
export default TopBar;