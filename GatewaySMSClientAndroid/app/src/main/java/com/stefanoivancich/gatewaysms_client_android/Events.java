package com.stefanoivancich.gatewaysms_client_android;

public class Events {

  // Event used to send message from HomeFragment to LogFragment
  public static class HomeToLog {
    private String message;
    public HomeToLog(String message) {
      this.message = message;
    }
    public String getMessage() {
      return message;
    }
  }

}
