import { AppLayout } from "@/components/layout/AppLayout";
import { ChatInterface } from "@/components/chat/ChatInterface";

const Chat = () => {
  return (
    <AppLayout>
      <div className="h-full">
        <ChatInterface />
      </div>
    </AppLayout>
  );
};

export default Chat;
