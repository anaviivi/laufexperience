import { ThemeProvider } from "./ThemeContext.jsx";
import CoachChat from "./CoachChat.jsx";

export default function App() {
  return (
    <ThemeProvider followSystem={true}>
      <CoachChat />
    </ThemeProvider>
  );
}
