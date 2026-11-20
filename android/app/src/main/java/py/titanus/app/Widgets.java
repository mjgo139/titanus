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

/** Dibuja los cuatro widgets de StoaGym con los datos que guarda la app (WidgetPlugin) */
public final class Widgets {
    static final String PREFS = "stoagym_widget";
    private static final int ORO = 0xFFF2C55C;
    private static final int APAGADO = 0xFF9D917C;
    private static final int SOBRE_ORO = 0xFF0B0B0B;
    private static final int[] DIAS = { R.id.d0, R.id.d1, R.id.d2, R.id.d3, R.id.d4, R.id.d5, R.id.d6 };

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
        int r = p.getInt("racha", 0);
        if (nombre.isEmpty()) {
            v.setTextViewText(R.id.hoy_etiqueta, "ENTRENAMIENTO");
            v.setTextViewText(R.id.hoy_nombre, "Sin rutina para hoy");
            v.setTextViewText(R.id.hoy_detalle, "Abrí StoaGym y elegí qué entrenar");
        } else {
            v.setTextViewText(R.id.hoy_etiqueta, esHoy ? "HOY TOCA" : "LO PRÓXIMO");
            v.setTextViewText(R.id.hoy_nombre, nombre);
            v.setTextViewText(R.id.hoy_detalle, p.getString("entrenoDetalle", ""));
        }
        v.setTextViewText(R.id.hoy_racha, r > 0 ? "Racha · " + romano(r) : "Sin racha aún");
        v.setTextViewText(R.id.hoy_boton, esHoy ? "Entrenar" : "Abrir");
        v.setOnClickPendingIntent(R.id.raiz, abrir(c, "/", id * 10 + 3));
        v.setOnClickPendingIntent(R.id.hoy_boton, abrir(c, esHoy ? "/?empezar=hoy" : "/entreno", id * 10 + 4));
        return v;
    }

    private static RemoteViews programa(Context c, SharedPreferences p, int id) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_programa);
        String nombre = p.getString("programa", "");
        int hechas = p.getInt("programaHechas", 0);
        int total = p.getInt("programaTotal", 0);
        if (nombre.isEmpty() || total == 0) {
            v.setTextViewText(R.id.prog_nombre, "Sin programa activo");
            v.setTextViewText(R.id.prog_detalle, "Elegí uno en Programas");
            v.setTextViewText(R.id.prog_porcentaje, "");
            v.setProgressBar(R.id.prog_barra, 100, 0, false);
            v.setOnClickPendingIntent(R.id.raiz, abrir(c, "/programas", id * 10 + 5));
        } else {
            v.setTextViewText(R.id.prog_nombre, nombre);
            String sig = p.getString("programaSiguiente", "");
            v.setTextViewText(R.id.prog_detalle, "Sesión " + Math.min(hechas + 1, total) + " de " + total + (sig.isEmpty() ? "" : " · " + sig));
            v.setTextViewText(R.id.prog_porcentaje, (hechas * 100 / total) + " %");
            v.setProgressBar(R.id.prog_barra, total, hechas, false);
            v.setOnClickPendingIntent(R.id.raiz, abrir(c, "/programas/" + p.getString("programaId", ""), id * 10 + 5));
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
