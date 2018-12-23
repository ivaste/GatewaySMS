package com.stefanoivancich.gatewaysms_client_android;

import android.content.Intent;
import android.os.Bundle;
import android.provider.Settings;
import android.support.v4.app.Fragment;
import android.telephony.SmsManager;
import android.text.GetChars;
import android.util.Log;

// UI libraries
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

// EventBus library
import org.greenrobot.eventbus.Subscribe;
import org.greenrobot.eventbus.ThreadMode;


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


    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        View view = inflater.inflate(R.layout.fragment_home, container, false);

        // Register the event to subscribe.
        GlobalBus.getBus().register(this);

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
        ///etURI.setEnabled(true);
        //btnConnect.setEnabled(true);
        //btnDisconnect.setEnabled(false);
        //tvStatus.setText("NOT ACTIVE");
        //tvStatus.setBackgroundColor(getResources().getColor(R.color.negative));
        //messagesSent=0;
        //tvMessagesSent.setText(String.valueOf(messagesSent));
        //messagesNOTSent=0;
        //tvMessagesNOTSent.setText(String.valueOf(messagesNOTSent));



        // Button CONNECT
        btnConnect.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                uri=etURI.getText().toString();

                // Start the SocketIO Service if is not running
                if(!SocketIoService.isRunning()){
                    getActivity().startService(new Intent(getContext(), SocketIoService.class));
                    Toast.makeText(getContext(), "Service NOT running",Toast.LENGTH_SHORT).show();
                }else Toast.makeText(getContext(), "Service IS running",Toast.LENGTH_SHORT).show();

                // Tell to service to Connect to SocketIO
                Events.connect connect = new Events.connect(uri);
                GlobalBus.getBus().post(connect);

            }
        });


        // Button DISCONNECT
        btnDisconnect.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                // Tell to service to Disconnect to SocketIO
                Events.disconnect event = new Events.disconnect();
                GlobalBus.getBus().post(event);

                setUIState(false);
            }
        });


        return view;
    }


    @Override
    public void onDestroyView() {
        super.onDestroyView();
        // Unregister the registered event.
        GlobalBus.getBus().unregister(this);
    }


    // Set UI State
    private void setUIState(boolean state){

        // If Active
        if(state){

            btnConnect.setEnabled(false);
            Log.d("SHomeFragment","SetUIState");
            btnDisconnect.setEnabled(true);

            etURI.setEnabled(false);
            tvStatus.setText("ACTIVE");
            tvStatus.setBackgroundColor(getResources().getColor(R.color.positive));

        }else{
            btnConnect.setEnabled(true);
            btnDisconnect.setEnabled(false);
            etURI.setEnabled(true);
            tvStatus.setText("NOT ACTIVE");
            tvStatus.setBackgroundColor(getResources().getColor(R.color.negative));
        }
    }

////// EVENT BUS EVENTS /////////////////////////////////////////////////////
    // EventBus is a library used to communicate with others app components
    @Subscribe(threadMode = ThreadMode.MAIN)
    public void eventUIState(Events.activeUI event) {
        setUIState(event.isActive());
    }

    @Subscribe(threadMode = ThreadMode.MAIN)
    public void eventUpdateParams(Events.updateHFParams event){
        tvMessagesSent.setText(String.valueOf(event.getMessagesSent()));
        tvMessagesNOTSent.setText(String.valueOf(event.getMessagesNOTSent()));
    }


}
