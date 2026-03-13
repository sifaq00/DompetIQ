import React, { useEffect } from 'react';
import { Pressable, Text } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';

interface AnimatedTabButtonProps {
  tab: string;
  Icon: any;
  isActive: boolean;
  onPress: () => void;
}

export function AnimatedTabButton({
  tab,
  Icon,
  isActive,
  onPress,
}: AnimatedTabButtonProps) {
  const translateY = useSharedValue(isActive ? -20 : 0);

  useEffect(() => {
    translateY.value = withSpring(isActive ? -20 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [isActive]);

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          },
          isActive ? {
            backgroundColor: '#1f57e7', // brand-500
            width: 56,
            height: 56,
            borderRadius: 28,
            borderWidth: 5,
            borderColor: '#ffffff',
            shadowColor: '#1741b5',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 8,
          } : {
            backgroundColor: 'transparent',
            width: 48,
            height: 48,
          },
          animatedIconStyle,
        ]}
      >
        {Icon && (
          <Icon size={isActive ? 22 : 24} color={isActive ? '#ffffff' : '#64748b'} />
        )}
      </Animated.View>
      
      <Text
        style={{
          position: 'absolute',
          bottom: isActive ? -10 : 4,
          fontSize: 10,
          fontWeight: isActive ? '800' : '600',
          color: isActive ? '#1f57e7' : '#64748b',
          fontFamily: 'PlusJakartaSans_700Bold',
        }}
      >
        {tab}
      </Text>
    </Pressable>
  );
}
