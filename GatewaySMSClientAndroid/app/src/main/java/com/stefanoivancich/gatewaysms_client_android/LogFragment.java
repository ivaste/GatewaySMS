package com.stefanoivancich.gatewaysms_client_android;

import android.os.Bundle;
import android.os.Handler;
import android.support.v4.app.Fragment;
import android.text.method.ScrollingMovementMethod;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import org.greenrobot.eventbus.Subscribe;
import org.greenrobot.eventbus.ThreadMode;


public class LogFragment extends Fragment {

    public TextView tvLOG;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        View view = inflater.inflate(R.layout.fragment_log, container, false);

        // Register the event to subscribe.
        GlobalBus.getBus().register(this);

        tvLOG = (TextView)view.findViewById(R.id.tvLOG);
        tvLOG.setMovementMethod(new ScrollingMovementMethod());




        return view;
    }

    @Override
    public void onDestroyView() {
      super.onDestroyView();
      // Unregister the registered event.
      GlobalBus.getBus().unregister(this);
    }



    @Subscribe(threadMode = ThreadMode.MAIN)
    public void getMessage(Events.HomeToLog event) {
      tvLOG.setText(tvLOG.getText()+event.getMessage());

    }



}
