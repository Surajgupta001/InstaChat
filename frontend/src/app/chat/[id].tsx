import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, FlatList, Image, TextInput, Alert } from 'react-native'
import { useEffect, useRef, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '@/assets/styles/ChatScreen.styles';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { formatTime } from '../../../utils/formateTime';
import Avatar from '../../../components/Avatar';
import Bubble from '../../../components/Bubble';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { api, useApp } from '../../../context/AppContext';
import { Message } from '../../../types';

export default function chatScreen() {

  const router = useRouter();

  const { id } = useLocalSearchParams<{ id: string }>();

  let { auth, conversations, messages, users, selectedConversation, typingUsers, setConversations, setMessages, sendWsEvent, setSelectedConversation } = useApp();

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaMime, setMediaMime] = useState<string>('image/jpeg');
  const [mediaName, setMediaName] = useState<string>('media.jpg');

  const flatListRef = useRef<FlatList>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const partner = selectedConversation?.participant;

  // Auto-select conversation if selectedConversation is null or mismatched (e.g., on direct page reload)
  useEffect(() => {
    if (id && conversations.length > 0) {
      const found = conversations.find((c) => c._id === id);
      if (found && selectedConversation?._id !== id) {
        setSelectedConversation(found);
      }
    }
  }, [id, conversations, selectedConversation, setSelectedConversation]);

  // Load Messages for this conversation
  useEffect(() => {
    if (!id || auth.loading) return;
    setLoading(true);
    const fetchMessages = async () => {
      api.get(`/messages/conversations/${id}/messages`)
        .then(({ data }) => {
          if (data.success) {
            setMessages(data.messages);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error(`[ChatScreen] Failed to load messages for conversation ${id}:`, err?.response?.status, err?.response?.data || err?.message);
          setTimeout(fetchMessages, 1000);
        });
    };
    fetchMessages();
  }, [id, auth.loading]);

  // Scroll to bottom when new message arrives
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const deleteChat = () => {
    const msg = `Delete this chat? This cannot be undone.`;
    Alert.alert('Confirm delete', msg, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const { data } = await api.delete(`/messages/conversations/${selectedConversation?._id}`);
            if (data.success) {
              setConversations((prev) => prev.filter((c) => c._id !== selectedConversation?._id));
              setSelectedConversation(null);
              router.back();
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to delete the chat. Please try again.');
          }
        }
      }
    ])
  };

  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission required', 'Allow access to your media library to send photos and videos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      const asset = result.assets[0];
      setMediaUri(asset.uri);
      setMediaMime(asset.mimeType || 'image/jpeg');
      setMediaName(asset.fileName || (asset.mimeType === 'video' ? 'video.mp4' : 'photo.jpg'));
    }
  };

  const send = async () => {
    if (sending || (!text.trim() && !mediaUri)) return;
    setSending(true);

    try {
      const formData = new FormData();
      formData.append('receiverId', partner!._id);
      if (text.trim()) {
        formData.append('text', text.trim());
      }
      if (mediaUri) {
        formData.append('file', {
          uri: mediaUri,
          type: mediaMime,
          name: mediaName,
        } as any);
      }

      const { data } = await api.post<{ success: boolean, message: Message }>('/messages/send', formData);
      if (data.success) {
        setMessages((prev) => [...prev, data.message]);
        const target = { receiverId: partner!._id };
        sendWsEvent({ type: 'message', ...target, payload: data.message });
        setText('');
        setMediaUri(null);
      }
    } catch (error: any) {
      console.error('[send] Message upload error details:', error?.response?.status, error?.response?.data || error?.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  }

  const handleTyping = (val: string) => {
    setText(val);
    const target = { receiverId: partner!._id };
    if (!target.receiverId) return;
    sendWsEvent({ type: 'typing', ...target, isTyping: true });

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }
    typingTimerRef.current = setTimeout(() => {
      sendWsEvent({ type: 'typing', ...target, isTyping: false });
    }, 1500);
  };

  const typingEntries = Object.entries(typingUsers).filter(([uid, isTyping]) => {
    if (!isTyping || uid === auth.user?._id) return false;

    return partner?._id === uid;
  })

  if (!selectedConversation) {
    return (
      <SafeAreaView
        style={styles.safe}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={Colors.onSurface}
          />
        </TouchableOpacity>
        <View style={styles.emptyState}>
          <Ionicons
            name="chatbubbles-outline"
            size={52}
            color={Colors.outlineVariant}
          />
        </View>
        <Text style={styles.emptyText}>Conversation not found yet..</Text>
      </SafeAreaView>
    )
  }

  const headerName = partner!.name;
  const headerAvatar = partner!.avatar;
  const headerSub = partner!.isOnline ? 'Online' : partner?.lastSeen ? `Last seen ${formatTime(partner.lastSeen)}` : 'Offline';

  return (
    <SafeAreaView
      style={styles.safe}
      edges={['top', 'bottom']}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={Colors.onSurface}
          />
        </TouchableOpacity>
        <Avatar
          name={headerName}
          src={headerAvatar}
          size={38}
          online={partner?.isOnline}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>
            {headerName}
            <Text style={styles.headerHandle}>@{partner?.handle}</Text>
          </Text>
          <Text style={[styles.headerSub, partner?.isOnline && { color: Colors.online }]}>{headerSub}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.backBtn}
          >
            <Ionicons
              name="call-outline"
              size={20}
              color={Colors.onSurfaceVariant}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backBtn}
          >
            <Ionicons
              name="videocam-outline"
              size={20}
              color={Colors.onSurfaceVariant}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={deleteChat}
          >
            <Ionicons
              name="trash-outline"
              size={20}
              color={Colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main */}
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages */}
        {loading ? (
          <ActivityIndicator
            style={{ flex: 1 }}
            color={Colors.primary}
          />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(m) => m._id}
            contentContainerStyle={styles.messageList}
            renderItem={({ item: msg, index }) => {
              const isMine = msg.sender === auth.user?._id;
              const prev = messages[index - 1];
              const showGap = !prev || prev.sender !== msg.sender;
              return (
                <View
                  style={showGap && index > 0 ? { marginTop: 10 } : {}}
                >
                  <Bubble msg={msg} isMine={isMine} />
                </View>
              )
            }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* Typing indicator */}
        {typingEntries.length > 0 && (
          <View style={styles.typingRow}>
            {typingEntries.map(([uid]) => {
              const u = users.find((x) => x._id === uid) || partner;
              return (
                <Text style={styles.typingText} key={uid}>
                  {u?.name || 'Someone'} is typing...
                </Text>
              );
            })}
          </View>
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          {/* Media Preview */}
          {mediaUri && (
            <View style={styles.mediaPreview}>
              <Image
                source={{ uri: mediaUri }}
                style={styles.mediaThumb}
              />
              <TouchableOpacity
                style={styles.mediaRemove}
                onPress={() => setMediaUri(null)}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color='#fff'
                />
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputRow}>
            <TouchableOpacity
              style={styles.attachBtn}
              onPress={pickMedia}
            >
              <Ionicons
                name="image-outline"
                size={22}
                color={Colors.onSurfaceVariant}
              />
            </TouchableOpacity>
            <TextInput
              style={styles.textInput}
              placeholder='Type a here message...'
              value={text}
              onChangeText={handleTyping}
              placeholderTextColor={Colors.outlineVariant}
              multiline
              maxLength={2000}
            />
            <TouchableOpacity
              disabled={sending || (!text.trim() && !mediaUri)}
              activeOpacity={0.5}
              onPress={send}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primaryContainer]}
                style={[styles.sendBtn, !text.trim() && !mediaUri && styles.sendBtnDisabled]}
              >
                {sending ? (
                  <ActivityIndicator
                    color='#fff'
                    size='small'
                  />
                ) : (
                  <Ionicons
                    name="send"
                    size={26}
                    color='#fff'
                  />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
