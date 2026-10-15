type TChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export default TChatMessage;
