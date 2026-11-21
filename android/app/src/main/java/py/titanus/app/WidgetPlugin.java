package py.titanus.app;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** La app web le pasa los datos a los widgets y pregunta si se abrió desde uno */
@CapacitorPlugin(name = "Widget")
public class WidgetPlugin extends Plugin {

    private SharedPreferences prefs() {
        return getContext().getSharedPreferences(Widgets.PREFS, Context.MODE_PRIVATE);
    }

    @PluginMethod
    public void actualizar(PluginCall call) {
        SharedPreferences.Editor e = prefs().edit();
        e.putInt("racha", call.getInt("racha", 0));
        e.putString("rango", call.getString("rango", ""));
        e.putString("fechas", call.getString("fechas", ""));
        e.putString("entreno", call.getString("entreno", ""));
        e.putString("entrenoDetalle", call.getString("entrenoDetalle", ""));
        e.putBoolean("esHoy", call.getBoolean("esHoy", false));
        e.putString("etiqueta", call.getString("etiqueta", ""));
        e.putString("boton", call.getString("boton", ""));
        e.putString("rutaBoton", call.getString("rutaBoton", ""));
        e.putString("programas", call.getString("programas", "[]"));
        e.apply();
        Widgets.actualizarTodos(getContext());
        call.resolve();
    }

    @PluginMethod
    public void rutaPendiente(PluginCall call) {
        String ruta = prefs().getString("ruta", null);
        prefs().edit().remove("ruta").apply();
        JSObject r = new JSObject();
        r.put("ruta", ruta);
        call.resolve(r);
    }
}
