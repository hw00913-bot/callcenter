import java.awt.Font;
import java.awt.font.FontRenderContext;
import java.util.Base64;
import java.nio.charset.StandardCharsets;
public class IndependentSvgAdvanceQA {
 public static void main(String[] args) {
  String text = new String(Base64.getDecoder().decode(args[3]),StandardCharsets.UTF_8);
  Font font = new Font(args[0],Integer.parseInt(args[2]),Integer.parseInt(args[1]));
  double advance = font.getStringBounds(text,new FontRenderContext(null,true,true)).getWidth();
  System.out.printf(java.util.Locale.ROOT,"{\"width\":%.9f,\"canDisplayUpTo\":%d,\"fontFamily\":\"%s\",\"javaVersion\":\"%s\"}%n",advance,font.canDisplayUpTo(text),font.getFamily(),System.getProperty("java.version"));
 }
}
