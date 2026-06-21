import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgXml } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const { colors } = useTheme();

  // Custom SVG logo markup (3 petals and a star)
  const logoSvg = `
    <svg width="60" height="60" viewBox="0 0 63 70" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M33.817 52.382c0-15.988 12.96-28.948 28.948-28.948v17.585c0 15.987-12.96 28.948-28.948 28.948zm-4.869 0c0-15.988-12.96-28.948-28.948-28.948v17.585c0 15.987 12.96 28.948 28.948 28.948z" fill="#8B5CF6"/>
        <g clip-path="url(#a)">
        <path d="M31.487 0c0 8.764 7.049 15.881 15.786 15.992l.207.001-.207.001c-8.737.11-15.786 7.228-15.786 15.992 0-8.833-7.16-15.993-15.993-15.993 8.833 0 15.993-7.16 15.993-15.993" fill="#A78BFA"/>
        </g>
        <defs>
        <clipPath id="a">
          <path fill="#fff" d="M15.494 0H47.48v31.986H15.494z"/>
        </clipPath>
        </defs>
    </svg>`;

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom']}>
      {/* Decorative Background Glowing Spheres */}
      <View style={styles.glowOrb1} />
      <View style={styles.glowOrb2} />
      <View style={styles.glowOrb3} />

      <View style={styles.mainLayout}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <SvgXml xml={logoSvg} width={34} height={34} />
            <Text style={styles.logoText}>
              Insta<Text style={styles.logoAccent}>Chat</Text>
            </Text>
          </View>
          <View style={styles.badgeContainer}>
            <Ionicons name="shield-checkmark" size={12} color="#A78BFA" />
            <Text style={styles.badgeText}>Secure</Text>
          </View>
        </View>

        {/* Hero Headline & Subheadline */}
        <View style={styles.topInfoArea}>
          <View style={styles.headlineContainer}>
            <Text style={styles.headlineText}>Connect.</Text>
            <Text style={styles.headlineText}>Chat.</Text>
            <Text style={styles.headlineText}>
              <Text style={{ color: '#FFFFFF' }}>Insta</Text>
              <Text style={{ color: '#A78BFA' }}>Chat.</Text>
            </Text>
          </View>
          <Text style={styles.subheadline}>
            A modern real-time messaging app built for meaningful connections.
          </Text>
        </View>

        {/* Phone Mockup Section */}
        <View style={styles.mockupWrapper}>
          {/* Tilted Mockup Frame */}
          <View style={styles.mockupTiltedFrame}>
            <View style={styles.phoneOuterBorder}>
              <View style={styles.phoneScreen}>
                {/* Phone Status Bar */}
                <View style={styles.statusBar}>
                  <Text style={styles.statusBarTime}>9:41</Text>
                  <View style={styles.statusBarIcons}>
                    <Ionicons name="cellular" size={10} color="#FFFFFF" style={styles.sbIcon} />
                    <Ionicons name="wifi" size={10} color="#FFFFFF" style={styles.sbIcon} />
                    <Ionicons name="battery-full" size={12} color="#FFFFFF" />
                  </View>
                </View>

                {/* Chat Header */}
                <View style={styles.chatHeader}>
                  <Image
                    source={{ uri: 'https://i.pravatar.cc/100?img=12' }}
                    style={styles.chatAvatar}
                  />
                  <View style={styles.chatHeaderInfo}>
                    <Text style={styles.chatUser}>Suraj</Text>
                    <View style={styles.onlineIndicator}>
                      <View style={styles.onlineDot} />
                      <Text style={styles.onlineText}>Online</Text>
                    </View>
                  </View>
                  <View style={styles.chatHeaderIcons}>
                    <Ionicons name="call" size={14} color="#A78BFA" style={styles.chIcon} />
                    <Ionicons name="videocam" size={14} color="#A78BFA" style={styles.chIcon} />
                  </View>
                </View>

                {/* Chat Scroll Area */}
                <View style={styles.chatFeed}>
                  {/* Bubble 1 (Sent) */}
                  <View style={styles.bubbleSentContainer}>
                    <LinearGradient
                      colors={['#8B5CF6', '#6366F1']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.bubbleSent}
                    >
                      <Text style={styles.bubbleText}>Hello!</Text>
                      <View style={styles.bubbleFooter}>
                        <Text style={styles.bubbleTime}>5m ago</Text>
                        <Ionicons name="checkmark-done" size={10} color="#FFFFFF" />
                      </View>
                    </LinearGradient>
                  </View>

                  {/* Bubble 2 (Image/Video Sent) */}
                  <View style={styles.bubbleSentContainer}>
                    <LinearGradient
                      colors={['#8B5CF6', '#6366F1']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.bubbleSent, styles.bubbleMedia]}
                    >
                      <Image
                        source={require('../assets/images/media-mockup.png')}
                        style={styles.bubbleImage}
                      />
                      <View style={styles.playButtonOverlay}>
                        <Ionicons name="play-circle" size={32} color="#FFFFFF" />
                      </View>
                      <View style={styles.bubbleFooter}>
                        <Text style={styles.bubbleTime}>4m ago</Text>
                        <Ionicons name="checkmark-done" size={10} color="#FFFFFF" />
                      </View>
                    </LinearGradient>
                  </View>

                  {/* Quote Card (Received/Message) */}
                  <View style={styles.quoteCardContainer}>
                    <Image
                      source={require('../assets/images/kalam.png')}
                      style={styles.quoteAvatar}
                    />
                    <View style={styles.quoteCard}>
                      <Text style={styles.quoteQuotes}>“</Text>
                      <Text style={styles.quoteText}>
                        If you want to shine like a sun, first burn like a sun.
                      </Text>
                      <Text style={styles.quoteAuthor}>— A.P.J. Kalam</Text>
                    </View>
                  </View>
                </View>

                {/* Chat Input Bar */}
                <View style={styles.chatInputBar}>
                  <TouchableOpacity style={styles.plusButton}>
                    <Ionicons name="add" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                  <Text style={styles.chatInputPlaceholder}>Type a message...</Text>
                  <TouchableOpacity style={styles.sendButton}>
                    <Ionicons name="paper-plane" size={12} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Floating Bubble */}
          <View style={styles.floatingChatBubble}>
            <LinearGradient
              colors={['#9333EA', '#3B82F6']}
              style={styles.floatingBubbleGradient}
            >
              <Ionicons name="chatbubble-ellipses" size={20} color="#FFFFFF" />
            </LinearGradient>
          </View>
        </View>

        {/* Bottom CTA Area */}
        <View style={styles.bottomArea}>
          <TouchableOpacity
            onPress={onGetStarted}
            activeOpacity={0.85}
            style={styles.ctaButtonWrapper}
          >
            <LinearGradient
              colors={['#8B5CF6', '#6366F1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaButton}
            >
              <Text style={styles.ctaButtonText}>Get Started Now</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={styles.ctaIcon} />
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.trustText}>✨ Real-Time • Secure • Seamless</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#050816',
  },
  mainLayout: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: height > 750 ? 20 : 10,
  },
  // Ambient glow background elements
  glowOrb1: {
    position: 'absolute',
    top: 50,
    right: -100,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#8B5CF6',
    opacity: 0.15,
    ...Platform.select({
      web: { filter: 'blur(60px)' },
      default: { shadowColor: '#8B5CF6', shadowRadius: 80, shadowOpacity: 0.15 },
    }),
  },
  glowOrb2: {
    position: 'absolute',
    bottom: 100,
    left: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#3B82F6',
    opacity: 0.12,
    ...Platform.select({
      web: { filter: 'blur(80px)' },
      default: { shadowColor: '#3B82F6', shadowRadius: 90, shadowOpacity: 0.12 },
    }),
  },
  glowOrb3: {
    position: 'absolute',
    top: height / 2 - 100,
    right: -120,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#9333EA',
    opacity: 0.15,
    ...Platform.select({
      web: { filter: 'blur(70px)' },
      default: { shadowColor: '#9333EA', shadowRadius: 80, shadowOpacity: 0.15 },
    }),
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: height > 750 ? 12 : 8,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 6,
    fontFamily: Platform.OS === 'ios' ? 'Outfit' : 'sans-serif-condensed',
  },
  logoAccent: {
    color: '#A78BFA',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(167, 139, 250, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.2)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    color: '#A78BFA',
    marginLeft: 4,
    fontWeight: '600',
  },
  // Headline Area
  topInfoArea: {
    marginTop: height > 750 ? 8 : 2,
    marginBottom: height > 750 ? 8 : 2,
  },
  headlineContainer: {
    marginBottom: 8,
  },
  headlineText: {
    fontSize: height > 750 ? 38 : 32,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: height > 750 ? 42 : 36,
    fontFamily: Platform.OS === 'ios' ? 'Outfit' : 'sans-serif-medium',
  },
  subheadline: {
    fontSize: height > 750 ? 14 : 12,
    color: '#A1A1AA',
    lineHeight: height > 750 ? 20 : 17,
  },
  // Mockup Section
  mockupWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: height > 750 ? 10 : 5,
    position: 'relative',
  },
  mockupTiltedFrame: {
    width: height > 750 ? 200 : 180,
    height: height > 750 ? 300 : 270,
    ...Platform.select({
      web: {
        transform: 'perspective(800px) rotateY(-12deg) rotateX(8deg) rotateZ(-4deg)',
      },
      default: {
        transform: [{ rotateY: '-12deg' }, { rotateX: '8deg' }, { rotateZ: '-4deg' }],
      },
    }),
  },
  phoneOuterBorder: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    borderWidth: 4,
    borderColor: '#111827',
    backgroundColor: '#0B0F19',
    padding: 4,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  phoneScreen: {
    flex: 1,
    backgroundColor: '#0B0F19',
    borderRadius: 22,
    overflow: 'hidden',
  },
  // StatusBar
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 18,
    paddingHorizontal: 12,
    backgroundColor: '#070A11',
  },
  statusBarTime: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '600',
  },
  statusBarIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sbIcon: {
    marginRight: 3,
  },
  // ChatHeader
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#161A23',
    backgroundColor: '#0B0F19',
  },
  chatAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  chatHeaderInfo: {
    flex: 1,
    marginLeft: 5,
  },
  chatUser: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4ADE80',
    marginRight: 2,
  },
  onlineText: {
    color: '#4ADE80',
    fontSize: 7,
    fontWeight: '500',
  },
  chatHeaderIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chIcon: {
    marginRight: 5,
  },
  // ChatFeed
  chatFeed: {
    flex: 1,
    padding: 6,
  },
  bubbleSentContainer: {
    alignSelf: 'flex-end',
    marginBottom: 6,
    maxWidth: '85%',
  },
  bubbleSent: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderBottomRightRadius: 2,
  },
  bubbleText: {
    color: '#FFFFFF',
    fontSize: 9,
    lineHeight: 11,
  },
  bubbleFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 1,
  },
  bubbleTime: {
    fontSize: 6,
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 2,
  },
  // Bubble Media
  bubbleMedia: {
    padding: 1.5,
    borderRadius: 10,
    width: 110,
    height: 70,
    overflow: 'hidden',
  },
  bubbleImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8.5,
  },
  playButtonOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -16 }, { translateY: -16 }],
  },
  // Quote Card
  quoteCardContainer: {
    flexDirection: 'row',
    marginBottom: 6,
    maxWidth: '85%',
  },
  quoteAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 4,
    marginTop: 2,
  },
  quoteCard: {
    backgroundColor: '#161A23',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    borderTopLeftRadius: 2,
    padding: 6,
  },
  quoteQuotes: {
    color: '#A78BFA',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 10,
    height: 6,
  },
  quoteText: {
    color: '#F3F4F6',
    fontSize: 8,
    fontStyle: 'italic',
    lineHeight: 10,
  },
  quoteAuthor: {
    color: '#A78BFA',
    fontSize: 7,
    fontWeight: 'bold',
    marginTop: 2,
  },
  // Input Bar
  chatInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 26,
    paddingHorizontal: 6,
    borderTopWidth: 1,
    borderTopColor: '#161A23',
    backgroundColor: '#0B0F19',
  },
  plusButton: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatInputPlaceholder: {
    flex: 1,
    color: '#6B7280',
    fontSize: 8,
    marginLeft: 5,
  },
  sendButton: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Floating decorative items
  floatingChatBubble: {
    position: 'absolute',
    right: 20,
    top: '40%',
    width: 36,
    height: 36,
    borderRadius: 18,
    shadowColor: '#9333EA',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  floatingBubbleGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Bottom Area
  bottomArea: {
    width: '100%',
    alignItems: 'center',
    marginTop: height > 750 ? 10 : 2,
  },
  ctaButtonWrapper: {
    width: '100%',
    borderRadius: 24,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: height > 750 ? 12 : 8,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: height > 750 ? 12 : 10,
    borderRadius: 24,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  ctaIcon: {
    marginLeft: 6,
  },
  trustText: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
