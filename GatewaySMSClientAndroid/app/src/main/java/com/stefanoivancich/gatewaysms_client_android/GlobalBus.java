package com.stefanoivancich.gatewaysms_client_android;

import org.greenrobot.eventbus.EventBus;

public class GlobalBus {
  private static EventBus sBus;
  public static EventBus getBus() {
    if (sBus == null)
      sBus = EventBus.getDefault();
    return sBus;
  }
}
