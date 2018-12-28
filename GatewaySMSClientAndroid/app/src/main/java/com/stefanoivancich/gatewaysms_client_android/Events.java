package com.stefanoivancich.gatewaysms_client_android;

public class Events {

  // Event used to send message from HomeFragment to LogFragment
  public static class UpdateLog {
    private String message;
    public UpdateLog(String message) {
      this.message = message;
    }
    public String getMessage() {
      return message;
    }
  }

  // Event used to connect (from HomeFragment to SocketIoService)
  public static class connect{
    private String uri;
    public connect(String uri){
      this.uri=uri;
    }
    public String getUri() {
      return uri;
    }
  }

  // Event used to connect (from HomeFragment to SocketIoService)
  public static class disconnect{
    public disconnect(){}
  }

  // Event used to set the UI in ACTIVE/NOT state (From SocketIOService to HomeFragment)
  public static class activeUI{
    private boolean active;
    public activeUI(boolean active){
      this.active=active;
    }
    public boolean isActive() {
      return active;
    }
  }

  // Event used to update the HomeFragment parameters (sms sent/not sent)
  public static class updateHFParams{
    private int messagesSent;
    private int messagesNOTSent;
    public updateHFParams(int messagesSent, int messagesNOTSent){
      this.messagesSent=messagesSent;
      this.messagesNOTSent=messagesNOTSent;
    }
    public int getMessagesSent(){
      return messagesSent;
    }
    public int getMessagesNOTSent() {
      return messagesNOTSent;
    }
  }


}
