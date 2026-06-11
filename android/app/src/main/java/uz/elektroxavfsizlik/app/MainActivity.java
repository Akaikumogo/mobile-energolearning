package uz.elektroxavfsizlik.app;

import android.os.Bundle;
import android.os.PowerManager;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

/**
 * MainActivity background audio uchun moslangan.
 *
 * Default Capacitor (Android v7) `WebView.onPause()` ni `super.onPause()`
 * vaqtida chaqirmaydi, lekin biz baribir WebView ichidagi audiotag uxlashini
 * oldini olish uchun `mediaPlaybackRequiresUserGesture = false`,
 * `domStorageEnabled = true` flaglarini o'rnatamiz va CPU wake lockni
 * isPlaying paytida sotib olamiz.
 *
 * Audio MediaSession API orqali tizim notification panelida ko'rinadi va
 * ekran o'chirilganda ham, home tugmasi bosilganda ham davom etadi.
 */
public class MainActivity extends BridgeActivity {

    private PowerManager.WakeLock wakeLock;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = this.bridge.getWebView();
        if (webView != null) {
            WebSettings settings = webView.getSettings();
            // Audio/Video user gesturesiz boshlanishiga ruxsat (Media Session API uchun).
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setDomStorageEnabled(true);
        }

        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        if (pm != null) {
            wakeLock = pm.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "ElektroLearn:AudioWakeLock"
            );
            wakeLock.setReferenceCounted(false);
        }
    }

    @Override
    public void onPause() {
        // MUHIM: super.onPause() WebView ni pause QILMAYDI Capacitor 7+ da.
        // Lekin har ehtimolga qarshi `webView.onPause()` ni chaqirmaymiz —
        // shu sababli audiotag tizim tomonidan ushlab turadi.
        super.onPause();
        if (wakeLock != null && !wakeLock.isHeld()) {
            try {
                // 30 minutgacha CPU ni ushlab turamiz, keyin avtomatik bo'shaymiz.
                wakeLock.acquire(30 * 60 * 1000L);
            } catch (Exception ignored) {}
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        if (wakeLock != null && wakeLock.isHeld()) {
            try {
                wakeLock.release();
            } catch (Exception ignored) {}
        }
    }

    @Override
    public void onDestroy() {
        if (wakeLock != null && wakeLock.isHeld()) {
            try {
                wakeLock.release();
            } catch (Exception ignored) {}
        }
        super.onDestroy();
    }
}
