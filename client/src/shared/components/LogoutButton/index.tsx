import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/Button";
import { createClient } from "@/shared/lib/supabase";
import * as styles from "./LogoutButton.styles";

export function LogoutButton() {
  const navigate = useNavigate();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  }

  return (
    <div className={styles.wrap}>
      <Button type="button" variant="ghost" onClick={handleLogout}>
        Log out
      </Button>
    </div>
  );
}

export default LogoutButton;
