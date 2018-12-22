package com.stefanoivancich.gatewaysms_client_android;

import android.os.Bundle;
import android.provider.Settings;
import android.support.v4.app.Fragment;
import android.telephony.SmsManager;
import android.util.Log;

// UI libraries
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

// Socket IO libraries
import com.github.nkzawa.emitter.Emitter;
import com.github.nkzawa.socketio.client.IO;
import com.github.nkzawa.socketio.client.Socket;
import org.json.JSONException;
import org.json.JSONObject;
import java.net.URISyntaxException;


public class HomeFragment extends Fragment {

    private TextView tvDeviceID;
    private String deviceId;
    private Button btnConnect;
    private Button btnDisconnect;
    private EditText etURI;
    private String uri;
    private TextView tvStatus;
    private TextView tvMessagesSent;
    private int messagesSent;
    private TextView tvMessagesNOTSent;
    private int messagesNOTSent;
    private Socket socket;


    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        View view = inflater.inflate(R.layout.fragment_home, container, false);

        // Device ID
        tvDeviceID = view.findViewById(R.id.tvDeviceID);
        deviceId = Settings.Secure.getString(getContext().getContentResolver(), Settings.Secure.ANDROID_ID);
        tvDeviceID.setText(deviceId);

        // UI elements
        tvStatus = (TextView)view.findViewById(R.id.tvStatus);
        tvMessagesSent = (TextView)view.findViewById(R.id.tvMessagesSent);
        tvMessagesNOTSent = (TextView)view.findViewById(R.id.tvMessagesNOTSent);
        btnConnect = (Button)view.findViewById(R.id.btnConnect);
        btnDisconnect = (Button)view.findViewById(R.id.btnDisconnect);
        etURI = (EditText)view.findViewById(R.id.etURI);
        etURI.setEnabled(true);
        btnConnect.setEnabled(true);
        btnDisconnect.setEnabled(false);
        tvStatus.setText("NOT ACTIVE");
        tvStatus.setBackgroundColor(getResources().getColor(R.color.negative));
        messagesSent=0;
        tvMessagesSent.setText(String.valueOf(messagesSent));
        messagesNOTSent=0;
        tvMessagesNOTSent.setText(String.valueOf(messagesNOTSent));



        // Button CONNECT
        btnConnect.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                uri=etURI.getText().toString();

                //Connect Socket client to the server
                try {
                    // Connect to socket
                    IO.Options opts = new IO.Options(); //Needed otherwise every time
                    opts.forceNew=true;
                    opts.reconnection=false;
                    socket = IO.socket(uri,opts);
                    socket.connect();

                    // Listen the Connection Acknowledge
                    socket.on("conACK", new Emitter.Listener() {
                        @Override
                        public void call(Object... args) {
                            getActivity().runOnUiThread(new Runnable() {
                                @Override
                                public void run() {
                                    Log.d("HomeFragment","Connection Acknowledge");

                                    // Send to server my Android unique device id
                                    socket.emit("idAndroid",deviceId);

                                    // Set UI components properly for  active state
                                    btnConnect.setEnabled(false);
                                    btnDisconnect.setEnabled(true);
                                    etURI.setEnabled(false);
                                    tvStatus.setText("ACTIVE");
                                    tvStatus.setBackgroundColor(getResources().getColor(R.color.positive));
                                }
                            });
                        }
                    });


                    // Listen the message to be sent
                    socket.on("message", new Emitter.Listener() {
                        @Override
                        public void call(final Object... args) {
                            getActivity().runOnUiThread(new Runnable() {
                                @Override
                                public void run() {
                                    JSONObject data = (JSONObject) args[0];
                                    try {

                                        // Extract data from socket
                                        String number = data.getString("number");
                                        String text = data.getString("text");
                                        String idSMS = data.getString("idSMS");



                                        // Send SMS
                                        try{
                                            SmsManager smgr = SmsManager.getDefault();
                                            smgr.sendTextMessage(number,null,text,null,null);

                                            // Send to server sms Acknowledge
                                            socket.emit("smsACK",idSMS);

                                            // Update UI
                                            messagesSent++;
                                            tvMessagesSent.setText(String.valueOf(messagesSent));

                                            // Update Log Fragment
                                            Events.HomeToLog homeToLogEvent =
                                                new Events.HomeToLog("SENT: "+number+": "+text+"\n");
                                            GlobalBus.getBus().post(homeToLogEvent);
                                        }
                                        catch (Exception e){

                                            // Send to server sms NOT Acknowledge
                                            socket.emit("smsNACK",idSMS);

                                            // Update UI
                                            messagesNOTSent++;
                                            tvMessagesNOTSent.setText(String.valueOf(messagesNOTSent));

                                            // Update Log Fragment
                                            Events.HomeToLog homeToLogEvent =
                                                new Events.HomeToLog("NOT SENT: "+number+": "+text+"\n");
                                            GlobalBus.getBus().post(homeToLogEvent);
                                        }

                                    } catch (JSONException e) {
                                        e.printStackTrace();
                                    }

                                }
                            });
                        }
                    });

                } catch (URISyntaxException e) {
                    e.printStackTrace();
                }
            }
        });


        // Button DISCONNECT
        btnDisconnect.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                socket.disconnect();

                Toast.makeText(getContext(), "Disconnected",Toast.LENGTH_SHORT).show();

                etURI.setEnabled(true);
                btnConnect.setEnabled(true);
                btnDisconnect.setEnabled(false);
                tvStatus.setText("NOT ACTIVE");
                tvStatus.setBackgroundColor(getResources().getColor(R.color.negative));
            }
        });


        return view;
    }


    @Override
    public void onDestroy() {
        super.onDestroy();

        socket.disconnect();

        etURI.setEnabled(true);
        btnConnect.setEnabled(true);
        btnDisconnect.setEnabled(false);
        tvStatus.setText("NOT ACTIVE");
        tvStatus.setBackgroundColor(getResources().getColor(R.color.negative));


    }


}
