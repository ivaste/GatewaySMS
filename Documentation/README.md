# The Problem

We want to send SMS messages to our users, like for: Login message, password recovery, "Merry Christmas", "Happy New Year", "a good start to this new school year", some opportunities for a specific school, etc...  
An external service such as Twillio, Nexmo or netfunitalia charge 5-8 cents per message in Italy.  
There are about 4 million students in Italian high schools, all possible users of WeStudents.  
So to send an SMS to all our users would cost us €200,000 or otherwise on the order of tens of thousands.

# The Solution

Build a service, hosted on the WeStudents servers, that sent an API request with sender cell number and text to be sent, through the internet connection communicate this request to a device equipped with a SIM and a GSM antenna that will send the SMS.

Currently (2019) it is not possible to use the internet to send text messages to mobile phones. You must necessarily use the GSM network, therefore a particular antenna capable of connecting.
From a brief feasibility study it turned out that using a physical hardware device like Arduino (30 €) or Raspberry Pi (40 €) with the SIM900 shield [Link](https://www.amazon.it/AZDelivery-SIM-900-Antenna-Arduino/dp/B01M9J4N56/ref=sr_1_2?ie=UTF8&qid=1544983884&sr=8-2&keywords=arduino+gsm+shield+2) (30 €), is not convenient, especially for the low reliability, the continuous maintenance required and non-portability.

Any Android smartphone is enough, better if it has dual SIM suppor


# Limits

The offers "unlimited SMS" do not really give the possibility to send an infinite number of messages, both for physical limitations of the telecommunications infrastructure and because the main Italian mobile phone operators put a maximum number of messages that can be sent. Generally:
- Max 30 sms/min
- Max 200 sms/day
- Max 3000 sms/month


# Costs

Cost of a SIM: € 10 activation + 3-5 €/month for the plan
- Annual SIM cost: 46-70 €
- Smartphone cost: <50 €
- Annual smartphone cost: <25 € (If we change smartphone every 2 years)
- Annual smartphone cost + 2 SIM: 117-165 €
- Max sms/year per SIM: 36,000
- Max sms/year per smartphone: 72,000 (If the smartphone has 2 SIM)
- Cost per SMS: 165/72,000 = 0.00229 € = 2.5 € thousandths (rounded)
- Cost of an external service: 5-8 cents/sms
- Savings: 0.05 / 0.0025 = 20 times less = 95%


# Service structure
![structure](https://github.com/ivaste/GatewaySMS/blob/master/Documentation/GatewaySMS.png)





