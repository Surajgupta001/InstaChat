import { View, Text, TouchableOpacity } from 'react-native'
import React, { memo, useMemo } from 'react'
import { Conversation } from '../types'
import { getStyles } from '@/assets/styles/ConvoItem.styles';
import { useTheme, useThemeStyles } from '../context/ThemeContext';
import Avatar from './Avatar';
import { formatTime } from '../utils/formateTime';
import { useApp } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';

interface ConversationItemProps {
    convo: Conversation;
    selected: boolean;
    onPress: () => void;
}

const ConversationItem = memo(function ConversationItem({ convo, selected, onPress }: ConversationItemProps) {
    const { colors } = useTheme();
    const styles = useThemeStyles(getStyles);
    const { auth } = useApp();

    const isGroup = convo.isGroup;
    const name = isGroup ? convo.groupName || 'Group Chat' : convo.participant?.name || 'User';
    const avatar = isGroup ? convo.groupAvatar : convo.participant?.avatar;
    const online = isGroup ? undefined : convo.participant?.isOnline;
    const sub = isGroup ? `${convo.members?.length || 0} members` : `@${convo.participant?.handle}`;
    const lastMsg = convo.lastMessage?.text || (convo.lastMessage?.mediaType === 'image' ? 'Photo' : (convo.lastMessage?.mediaType ? 'Video' : 'Start a Conversation'));

    const userId = auth.user?._id;
    const isLastMsgFromMe = convo.lastMessage?.sender === userId;
    const isUnread = !isLastMsgFromMe && convo.lastMessage && !convo.lastMessage.read;
    const unreadCount = convo.unreadCount ?? (isUnread ? 1 : 0);

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPress}
            style={[styles.row, selected && styles.rowSelected]}
        >
            <Avatar name={name} src={avatar} size={48} online={online} />
            <View style={styles.info}>
                <View style={styles.topRow}>
                    <View style={styles.nameCol}>
                        <Text style={styles.name}>{name}</Text>
                        <Text style={styles.handle}>{sub}</Text>
                    </View>
                    {convo.updatedAt && (
                        <Text style={[styles.time, isUnread && { color: colors.primary, fontWeight: '700' }]}>
                            {formatTime(convo.updatedAt)}
                        </Text>
                    )}
                </View>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                        {isLastMsgFromMe && convo.lastMessage && (
                            <Ionicons
                                name={convo.lastMessage.read ? "checkmark-done" : "checkmark"}
                                size={15}
                                color={convo.lastMessage.read ? colors.primary : colors.outline}
                                style={{ marginRight: 4 }}
                            />
                        )}
                        <Text 
                            style={[
                                styles.lastMsg, 
                                { flex: 1, marginTop: 0 }, 
                                isUnread && { fontWeight: '700', color: colors.onSurface }
                            ]} 
                            numberOfLines={1}
                        >
                            {lastMsg}
                        </Text>
                    </View>
                    
                    {unreadCount > 0 && (
                        <View 
                            style={{ 
                                minWidth: 20, 
                                height: 20, 
                                borderRadius: 10, 
                                backgroundColor: colors.primary,
                                justifyContent: 'center',
                                alignItems: 'center',
                                paddingHorizontal: 5,
                            }} 
                        >
                            <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: 'bold' }}>
                                {unreadCount}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
});

export default ConversationItem;
