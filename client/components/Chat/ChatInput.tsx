//import Button from "components/UI/Button";
//import Card from "components/UI/Card";
//import Input from "./components/UI/Input";
import React, { useRef } from "react";

const ChatInput: React.FC<{ sendMessage: (content: string) => void }> = ({ sendMessage }) => {
  const contentRef = useRef<HTMLInputElement>(null);

  const submitHandler = (event: React.FormEvent) => {
    event.preventDefault()
    if (contentRef.current) {
      const content = contentRef.current.value.trim();
      if (content) {
        sendMessage(content);
      }
    }
  };

  return (
    <form onSubmit={submitHandler}>
    <Card>
      <Input type="text" name="content" label="Send Message" ref={contentRef} />
      <Button type="submit">Send</Button>
    </Card>
    </form>
  );
};

export default ChatInput;
