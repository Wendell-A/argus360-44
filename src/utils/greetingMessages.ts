type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

interface GreetingMessage {
  greeting: string;
  message: string;
}

const greetingMessages: Record<TimeOfDay, GreetingMessage[]> = {
  morning: [
    { greeting: "Bom dia", message: "Vamos começar bem!" },
    { greeting: "Bom dia", message: "Ótimo dia para vendas!" },
    { greeting: "Bom dia", message: "Hoje será produtivo!" },
    { greeting: "Bom dia", message: "Novas oportunidades te esperam!" },
    { greeting: "Bom dia", message: "Que venha o sucesso!" },
  ],
  afternoon: [
    { greeting: "Boa tarde", message: "Continue firme!" },
    { greeting: "Boa tarde", message: "Boas vendas!" },
    { greeting: "Boa tarde", message: "Mantenha o ritmo!" },
    { greeting: "Boa tarde", message: "A tarde é sua!" },
    { greeting: "Boa tarde", message: "Foco nos resultados!" },
  ],
  evening: [
    { greeting: "Boa noite", message: "Finalize com chave de ouro!" },
    { greeting: "Boa noite", message: "Últimas oportunidades!" },
    { greeting: "Boa noite", message: "Ainda dá tempo!" },
    { greeting: "Boa noite", message: "Termine bem o dia!" },
    { greeting: "Boa noite", message: "Foco até o fim!" },
  ],
  night: [
    { greeting: "Boa noite", message: "Descanse bem!" },
    { greeting: "Boa noite", message: "Até amanhã!" },
    { greeting: "Boa noite", message: "Ótimo trabalho hoje!" },
    { greeting: "Boa noite", message: "Você merece descansar!" },
    { greeting: "Boa noite", message: "Recarregue as energias!" },
  ],
};

export function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

export function getRandomGreeting(): GreetingMessage {
  const timeOfDay = getTimeOfDay();
  const messages = greetingMessages[timeOfDay];
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
}

export function getGreetingForUser(firstName: string): string {
  const { greeting, message } = getRandomGreeting();
  return `${greeting}, ${firstName}! ${message}`;
}
