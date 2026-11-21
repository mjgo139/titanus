package py.titanus.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Calendar;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import org.json.JSONArray;
import org.json.JSONObject;
import android.view.View;

/** Dibuja los cuatro widgets de StoaGym con los datos que guarda la app (WidgetPlugin) */
public final class Widgets {
    static final String PREFS = "stoagym_widget";
    private static final int ORO = 0xFFF2C55C;
    private static final int APAGADO = 0xFF9D917C;
    private static final int SOBRE_ORO = 0xFF0B0B0B;
    private static final int[] DIAS = { R.id.d0, R.id.d1, R.id.d2, R.id.d3, R.id.d4, R.id.d5, R.id.d6 };
    private static final int[] FILAS = { R.id.prog_fila0, R.id.prog_fila1, R.id.prog_fila2 };
    private static final int[] NOMBRES = { R.id.prog_nombre0, R.id.prog_nombre1, R.id.prog_nombre2 };
    private static final int[] PORCENTAJES = { R.id.prog_pct0, R.id.prog_pct1, R.id.prog_pct2 };
    private static final int[] DETALLES = { R.id.prog_detalle0, R.id.prog_detalle1, R.id.prog_detalle2 };
    private static final int[] BARRAS = { R.id.prog_barra0, R.id.prog_barra1, R.id.prog_barra2 };

    private Widgets() {}

    public static void actualizarTodos(Context c) {
        AppWidgetManager m = AppWidgetManager.getInstance(c);
        Class<?>[] tipos = { WidgetRacha.class, WidgetSemana.class, WidgetHoy.class, WidgetPrograma.class };
        for (Class<?> t : tipos) {
            for (int id : m.getAppWidgetIds(new ComponentName(c, t))) dibujar(c, m, id, t);
        }
    }

    static void dibujar(Context c, AppWidgetManager m, int id, Class<?> tipo) {
        SharedPreferences p = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        RemoteViews v;
        if (tipo == WidgetRacha.class) v = racha(c, p, id);
        else if (tipo == WidgetSemana.class) v = semana(c, p, id);
        else if (tipo == WidgetHoy.class) v = hoy(c, p, id);
        else v = programa(c, p, id);
        m.updateAppWidget(id, v);
    }

    /** Abre la app en una pantalla (la ruta la lee la web con WidgetPlugin.rutaPendiente) */
    private static PendingIntent abrir(Context c, String ruta, int codigo) {
        Intent i = new Intent(c, MainActivity.class);
        i.setAction("py.titanus.app.WIDGET_" + codigo);
        i.putExtra("ruta", ruta);
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(c, codigo, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static RemoteViews racha(Context c, SharedPreferences p, int id) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_racha);
        int r = p.getInt("racha", 0);
        v.setTextViewText(R.id.racha_numero, r > 0 ? romano(r) : "0");
        v.setTextViewText(R.id.racha_texto, r == 0 ? "Empezá tu racha" : r == 1 ? "semana seguida" : "semanas seguidas");
        v.setTextViewText(R.id.racha_rango, p.getString("rango", ""));
        v.setOnClickPendingIntent(R.id.raiz, abrir(c, "/progreso", id * 10 + 1));
        return v;
    }

    private static RemoteViews semana(Context c, SharedPreferences p, int id) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_semana);
        Set<String> hechas = new HashSet<>(Arrays.asList(p.getString("fechas", "").split(",")));
        SimpleDateFormat f = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
        Calendar cal = Calendar.getInstance();
        int hoy = (cal.get(Calendar.DAY_OF_WEEK) + 5) % 7; // lunes = 0
        cal.add(Calendar.DAY_OF_MONTH, -hoy);
        int cuenta = 0;
        for (int i = 0; i < 7; i++) {
            boolean hecho = hechas.contains(f.format(cal.getTime()));
            if (hecho) cuenta++;
            v.setInt(DIAS[i], "setBackgroundResource", hecho ? R.drawable.widget_dia_hecho : i == hoy ? R.drawable.widget_dia_hoy : R.drawable.widget_dia_vacio);
            v.setTextColor(DIAS[i], hecho ? SOBRE_ORO : i == hoy ? ORO : APAGADO);
            cal.add(Calendar.DAY_OF_MONTH, 1);
        }
        v.setTextViewText(R.id.semana_cuenta, String.valueOf(cuenta));
        v.setOnClickPendingIntent(R.id.raiz, abrir(c, "/", id * 10 + 2));
        return v;
    }

    private static RemoteViews hoy(Context c, SharedPreferences p, int id) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_hoy);
        String nombre = p.getString("entreno", "");
        boolean esHoy = p.getBoolean("esHoy", false);
        String etiqueta = p.getString("etiqueta", "");
        String boton = p.getString("boton", "");
        String rutaBoton = p.getString("rutaBoton", "");
        int r = p.getInt("racha", 0);
        if (nombre.isEmpty()) {
            v.setTextViewText(R.id.hoy_etiqueta, "ENTRENAMIENTO");
            v.setTextViewText(R.id.hoy_nombre, "Sin rutina para hoy");
            v.setTextViewText(R.id.hoy_detalle, "Abrí StoaGym y elegí qué entrenar");
        } else {
            v.setTextViewText(R.id.hoy_etiqueta, !etiqueta.isEmpty() ? etiqueta : esHoy ? "HOY TOCA" : "LO PRÓXIMO");
            v.setTextViewText(R.id.hoy_nombre, nombre);
            v.setTextViewText(R.id.hoy_detalle, p.getString("entrenoDetalle", ""));
        }
        v.setTextViewText(R.id.hoy_racha, r > 0 ? "Racha · " + romano(r) : "Sin racha aún");
        v.setTextViewText(R.id.hoy_boton, !boton.isEmpty() ? boton : esHoy ? "Entrenar" : "Abrir");
        v.setOnClickPendingIntent(R.id.raiz, abrir(c, "/", id * 10 + 3));
        v.setOnClickPendingIntent(R.id.hoy_boton, abrir(c, !rutaBoton.isEmpty() ? rutaBoton : esHoy ? "/?empezar=hoy" : "/entreno", id * 10 + 4));
        return v;
    }

    /** Hasta 3 programas en curso, uno por fila */
    private static RemoteViews programa(Context c, SharedPreferences p, int id) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_programa);
        JSONArray lista;
        try { lista = new JSONArray(p.getString("programas", "[]")); } catch (Exception e) { lista = new JSONArray(); }
        int n = Math.min(lista.length(), 3);
        v.setOnClickPendingIntent(R.id.raiz, abrir(c, "/programas", id * 10 + 5));
        v.setTextViewText(R.id.prog_titulo, n > 1 ? "TUS PROGRAMAS" : "TU PROGRAMA");
        if (n == 0) {
            v.setViewVisibility(FILAS[0], View.VISIBLE);
            v.setTextViewText(NOMBRES[0], "Sin programa activo");
            v.setTextViewText(PORCENTAJES[0], "");
            v.setTextViewText(DETALLES[0], "Elegí uno en Programas (hasta 3 a la vez)");
            v.setViewVisibility(DETALLES[0], View.VISIBLE);
            v.setProgressBar(BARRAS[0], 100, 0, false);
            v.setViewVisibility(FILAS[1], View.GONE);
            v.setViewVisibility(FILAS[2], View.GONE);
            return v;
        }
        for (int i = 0; i < 3; i++) {
            if (i >= n) { v.setViewVisibility(FILAS[i], View.GONE); continue; }
            JSONObject o = lista.optJSONObject(i);
            if (o == null) { v.setViewVisibility(FILAS[i], View.GONE); continue; }
            int hechas = o.optInt("hechas", 0);
            int total = Math.max(1, o.optInt("total", 1));
            v.setViewVisibility(FILAS[i], View.VISIBLE);
            v.setTextViewText(NOMBRES[i], o.optString("nombre", ""));
            v.setTextViewText(PORCENTAJES[i], (hechas * 100 / total) + " %");
            String sig = o.optString("siguiente", "");
            v.setTextViewText(DETALLES[i], "Sesión " + Math.min(hechas + 1, total) + " de " + total + (sig.isEmpty() ? "" : " · " + sig));
            // Con 3 programas no entra el detalle: queda nombre + barra
            v.setViewVisibility(DETALLES[i], n >= 3 ? View.GONE : View.VISIBLE);
            v.setProgressBar(BARRAS[i], total, hechas, false);
            v.setOnClickPendingIntent(FILAS[i], abrir(c, "/programas/" + o.optString("id", ""), id * 10 + 6 + i));
        }
        return v;
    }

    static String romano(int n) {
        int[] v = { 1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1 };
        String[] s = { "M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I" };
        StringBuilder r = new StringBuilder();
        for (int i = 0; i < v.length; i++) while (n >= v[i]) { r.append(s[i]); n -= v[i]; }
        return r.toString();
    }
}
