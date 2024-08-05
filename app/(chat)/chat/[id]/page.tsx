import { redirect } from 'next/navigation'

import { getChat, getMissingKeys } from '@/app/actions'
import { Chat } from '@/components/chat'
import { AI } from '@/lib/chat/actions'

export interface ChatPageProps {
  params: {
    id: string
  }
}

export default async function ChatPage({ params }: ChatPageProps) {
  const missingKeys = await getMissingKeys()

  const chat = await getChat(params.id, "")

  if (!chat) {
    redirect('/')
  }

  return (
    <AI initialAIState={{ chatId: chat.id, messages: chat.messages }}>
      <Chat
        id={chat.id}
        initialMessages={chat.messages}
        missingKeys={missingKeys}
      />
    </AI>
  )
}
