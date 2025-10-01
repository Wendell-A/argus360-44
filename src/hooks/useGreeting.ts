import { useState, useEffect } from 'react';
import { getRandomGreeting } from '@/utils/greetingMessages';

export function useGreeting(firstName: string = 'usuário') {
  const [greeting, setGreeting] = useState(() => {
    const { greeting: greetingText, message } = getRandomGreeting();
    return { greeting: greetingText, message, fullGreeting: `${greetingText}, ${firstName}!` };
  });

  useEffect(() => {
    // Atualizar saudação quando o nome mudar
    const { greeting: greetingText, message } = getRandomGreeting();
    setGreeting({
      greeting: greetingText,
      message,
      fullGreeting: `${greetingText}, ${firstName}!`
    });

    // Atualizar a cada hora
    const interval = setInterval(() => {
      const { greeting: newGreeting, message: newMessage } = getRandomGreeting();
      setGreeting({
        greeting: newGreeting,
        message: newMessage,
        fullGreeting: `${newGreeting}, ${firstName}!`
      });
    }, 3600000); // 1 hora

    return () => clearInterval(interval);
  }, [firstName]);

  return greeting;
}
