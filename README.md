# GatewaySMS

![structure](https://github.com/ivaste/GatewaySMS/blob/master/Documentation/GatewaySMS_Scheme.png)


## Overview
GatewaySMS is a NodeJS Express - Android system that convert an API request to a SMS.

Currently (2019) it is not possible to use internet network to send text messages to mobile phones. You must necessarily use the GSM network, therefore a particular antenna capable of connecting.  
From a brief feasibility study it turned out that using a physical hardware device like Arduino (30 €) or Raspberry Pi (40 €) with the SIM900 shield [Link](https://www.amazon.it/AZDelivery-SIM-900-Antenna-Arduino/dp/B01M9J4N56/ref=sr_1_2?ie=UTF8&qid=1544983884&sr=8-2&keywords=arduino+gsm+shield+2) (30 €), is not convenient, especially for the low reliability, the continuous maintenance required and non-portability.  
Any Android smartphone can easily do the job, better if it has dual SIM support.


## Installation

Open GatewaySMS-Server-NodeJS folder and use the package manager [npm](https://www.npmjs.com/get-npm) to install the needed components:

```bash
npm install --save express socket.io
npm install body-parser --save
```

## Usage

Start the server by running:

```bash
node index.js
```

Install the apk to Android smartphones that you want to use has SMS sender.

API POST structure:
```
URL: http://192.168.1.105:3000/sendmessage
Header:
Content-Type: application/json
Body:
{
  "number": "+391234567891",
  "text": "helloooo"
}
```

API POST example: 
```bash
curl -X POST -H 'Content-Type: application/json' -d '{
  "number": "+391234567891",
  "text": "helloooo"
}' -v -i 'http://192.168.1.105:3000/sendmessage'
```
<!--
## Docker image
Download Docker image:
```bash
docker pull onaciccio/gateway:v1
```

Or just run it:
```bash
docker run -p 3000:3000 onaciccio/gateway:v1
```
-->

## Features

- [x] Basic Android app
- [x] Basic NodeJS Server API
- [x] Choose the device that has less SMS sent
- [ ] Double SIM support
- [ ] Interactive UI for server side


## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[![License](http://img.shields.io/:license-mit-blue.svg?style=flat-square)](http://badges.mit-license.org)
- **[MIT license](http://opensource.org/licenses/mit-license.php)**
