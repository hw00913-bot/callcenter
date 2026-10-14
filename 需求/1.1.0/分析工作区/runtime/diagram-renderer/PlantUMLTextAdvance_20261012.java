import java.awt.Font;
import java.awt.font.FontRenderContext;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
public class PlantUMLTextAdvance_20261012 {
 public static void main(String[] args) {
  String family=args[0], text=new String(Base64.getDecoder().decode(args[3]),StandardCharsets.UTF_8);
  Font font=new Font(family,Integer.parseInt(args[2]),Integer.parseInt(args[1]));
  FontRenderContext frc=new FontRenderContext(null,true,true);
  double w=font.getStringBounds(text,frc).getWidth();
  System.out.printf(java.util.Locale.ROOT,"{\"width\":%.9f,\"canDisplayUpTo\":%d,\"javaVersion\":\"%s\",\"fontFamily\":\"%s\"}%n",w,font.canDisplayUpTo(text),System.getProperty("java.version"),font.getFamily());
 }
}
