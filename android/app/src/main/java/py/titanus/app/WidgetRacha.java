package py.titanus.app;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;

/** Widget "Racha" de StoaGym (el dibujo está en Widgets.java) */
public class WidgetRacha extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) Widgets.dibujar(context, manager, id, WidgetRacha.class);
    }
}
