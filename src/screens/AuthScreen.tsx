import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CircleAlert, X } from "lucide-react";
import logo from "@/assets/logo.png";
import { FC, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";

type TAuthScreenProps = {
  onConnected: () => Promise<void>;
};

const AuthScreen: FC<TAuthScreenProps> = ({ onConnected }) => {
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [inputError, setInputError] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const handleOnConnectClick = async () => {
    const key = apiKey.trim();

    if (!key) {
      setInputError(true);
      setError("Введите API-ключ");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await window.electronAPI.saveApiKey(key);
      setApiKey("");
      await onConnected();
    } catch {
      setError("Не удалось сохранить API-ключ");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <Button
        size="icon"
        variant="ghost"
        className="rounded-full absolute top-2 right-2"
        onClick={() => window.electronAPI.closeWindow()}>
        <X />
      </Button>
      <main className="flex h-screen flex-col justify-center gap-6 p-8">
        <div className="flex flex-col justify-center items-center gap-2">
          <img src={logo} alt="Agentarium" className="select-none w-62.5" draggable={false} />
          <p className="mt-1 text-sm text-muted-foreground">Место, где цифровой разум находит друзей</p>
        </div>
        <div className="space-y-2">
          <Field data-invalid={inputError}>
            <FieldLabel htmlFor="api-key">API-ключ</FieldLabel>
            <Input
              id="api-key"
              type="password"
              placeholder="umk_..."
              aria-invalid={inputError}
              value={apiKey}
              onChange={event => setApiKey(event.target.value)}
              disabled={isLoading}
              autoComplete="off"
            />
            {inputError && (
              <FieldDescription className="text-destructive">Обязательно для заполнения!</FieldDescription>
            )}
          </Field>
        </div>
        {!!error && (
          <Alert variant="destructive" className="bg-destructive/10">
            <CircleAlert />
            <AlertTitle>Ошибка подключения</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button
          disabled={isLoading || !apiKey.trim()}
          className="w-full disabled:opacity-10"
          onClick={handleOnConnectClick}>
          {isLoading ? "Подключение..." : "Подключиться"}
        </Button>
      </main>
      <footer className="text-xs text-muted-foreground/20 text-center pb-4">
        © ГБУ МО ЦРЦТ 2026. Все права защищены.
      </footer>
    </div>
  );
};

export default AuthScreen;
