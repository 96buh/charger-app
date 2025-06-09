package expo.modules.mybattery

import android.content.Intent
import android.content.IntentFilter
import android.content.Context         
import android.os.BatteryManager        
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.net.URL

class MybatteryModule : Module() {
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  override fun definition() = ModuleDefinition {
    Name("Mybattery")

    /*
     * BatteryManager API調用
     * 一次回傳 電流 mA、電壓 mV、溫度 °C」
     * current_mA  : Double (充電時為負)
     * voltage_mV  : Int
     * temperature_C: Double
    */
    Function("getStats") {
      val ctx = appContext.reactContext
        ?: throw IllegalStateException("React context missing")

      // 1. 電流 ── BatteryManager 的 property，單位 µA
      val bm = ctx.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
      val currentUa = bm.getLongProperty(
        BatteryManager.BATTERY_PROPERTY_CURRENT_NOW
      )
      val currentMa = currentUa / 1_000.0   // 轉成 mA

      // 2. 電壓與溫度 
      val intent = ctx.registerReceiver(
        null,
        IntentFilter(Intent.ACTION_BATTERY_CHANGED)
      ) ?: throw IllegalStateException("No ACTION_BATTERY_CHANGED intent")

      val voltageMv =
        intent.getIntExtra(BatteryManager.EXTRA_VOLTAGE, -1)        // mV
      val tempTenthC =
        intent.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, -1)    // 0.1 °C
      val tempC = if (tempTenthC > 0) tempTenthC / 10.0 else Double.NaN

      mapOf(
        "current_mA"     to currentMa,
        "voltage_mV"     to voltageMv,
        "temperature_C"  to tempC
      )
    }
    
    // 測試用function
    Function("hello") {
      "Hello world! 👋"
    }

    // Defines a JavaScript function that always returns a Promise and whose native code
    // is by default dispatched on the different thread than the JavaScript runtime runs on.
    AsyncFunction("setValueAsync") { value: String ->
      // Send an event to JavaScript.
      sendEvent("onChange", mapOf(
        "value" to value
      ))
    }

    // Enables the module to be used as a native view. Definition components that are accepted as part of
    // the view definition: Prop, Events.
    View(MybatteryView::class) {
      // Defines a setter for the `url` prop.
      Prop("url") { view: MybatteryView, url: URL ->
        view.webView.loadUrl(url.toString())
      }
      // Defines an event that the view can send to JavaScript.
      Events("onLoad")
    }
  }
}
