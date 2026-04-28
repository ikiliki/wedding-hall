import { Button } from "@/components/Button";
import * as styles from "./LogoutButton.styles";

export function LogoutButton() {
  return (
    <form action="/logout" method="post" className={styles.form}>
      <Button type="submit" variant="ghost">
        Log out
      </Button>
    </form>
  );
}

export default LogoutButton;
