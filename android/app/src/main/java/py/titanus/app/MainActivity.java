package py.titanus.app;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Puente para los widgets (antes de super.onCreate, como pide Capacitor)
        registerPlugin(WidgetPlugin.class);
        super.onCreate(savedInstanceState);
        guardarRuta(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        guardarRuta(intent);
    }

    /** Si se abrió desde un widget, guarda a qué pantalla ir; la app la lee al volver a primer plano */
    private void guardarRuta(Intent intent) {
        if (intent == null) return;
        String ruta = intent.getStringExtra("ruta");
        if (ruta != null) {
            getSharedPreferences(Widgets.PREFS, MODE_PRIVATE).edit().putString("ruta", ruta).apply();
            intent.removeExtra("ruta");
        }
    }
}
