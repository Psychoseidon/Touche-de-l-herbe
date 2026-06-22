import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const SWIPE_THRESHOLD = 120;

export function SwipeCard({
  onSwiped,
  children,
}: {
  onSwiped: (direction: 'LIKE' | 'PASS') => void;
  children: React.ReactNode;
}) {
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      rotate.value = event.translationX / 20;
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        translateX.value = withSpring(600);
        runOnJS(onSwiped)('LIKE');
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withSpring(-600);
        runOnJS(onSwiped)('PASS');
      } else {
        translateX.value = withSpring(0);
        rotate.value = withSpring(0);
      }
    });

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotateZ: `${rotate.value}deg` },
    ],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, style]}>{children}</Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
});
