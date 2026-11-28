package com.betterwaymortgages.os;

import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();
            WebSettings settings = webView.getSettings();
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setDomStorageEnabled(true);
            settings.setAllowFileAccess(true);

            webView.setWebChromeClient(new BridgeWebChromeClient(this.bridge) {
                @Override
                public void onPermissionRequest(final PermissionRequest request) {
                    if (request != null && request.getOrigin() != null) {
                        String host = request.getOrigin().getHost();
                        if ("betterwayos.vercel.app".equalsIgnoreCase(host)
                                || "betterwaymortgages.com".equalsIgnoreCase(host)
                                || "localhost".equalsIgnoreCase(host)) {
                            runOnUiThread(() -> request.grant(request.getResources()));
                            return;
                        }
                    }
                    super.onPermissionRequest(request);
                }
            });
        }
    }
}
