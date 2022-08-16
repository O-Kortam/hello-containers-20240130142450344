import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { ZoomMtg } from '@zoomus/websdk';
import ZoomMtgEmbedded from '@zoomus/websdk/embedded';
import { environment } from 'src/environments/environment';

ZoomMtg.setZoomJSLib('https://source.zoom.us/2.4.5/lib', '/av');

ZoomMtg.preLoadWasm();
ZoomMtg.prepareWebSDK();
// loads language files, also passes any error messages to the ui
ZoomMtg.i18n.load('en-US');
ZoomMtg.i18n.reload('en-US');
@Component({
  selector: 'app-zoom-wrapper',
  templateUrl: './zoom-wrapper.component.html',
  styleUrls: ['./zoom-wrapper.component.scss'],
})
export class ZoomWrapperComponent implements OnInit, OnDestroy {
  apiKey = 'KvCAXBWxSCWGarDTtwNynA';
  meetingNumber = '';
  role = 0;
  userName = 'Customer';
  userEmail = 'Customer@gmail.com';
  passWord = '';
  meetingSDKElement: HTMLElement;
  client = ZoomMtgEmbedded.createClient();
  signature = '';
  leaveUrl = '';
  subscription: any;
  meetingStarted = false;
  constructor(
    public httpClient: HttpClient,
    @Inject(DOCUMENT) document: any,
    private router: ActivatedRoute
  ) {}
  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
  ngOnInit(): void {
    document.getElementById('zmmtg-root').style.display = 'none';
    this.router.params.subscribe((res: any) => {
      this.meetingNumber = res.id;
      this.passWord = res.pwd;
      this.userName = res.name;
      this.getSignature();
    });
  }
  getSignature() {
    this.httpClient
      .post(environment.baseUrl, {
        meetingNumber: this.meetingNumber,
        role: this.role,
      })

      .toPromise()
      .then((data: any) => {
        console.log(data);
        window.parent.postMessage('Open', '*');
        if (data.signature) {
          this.signature = data.signature;
          this.startMeeting();
        } else {
          console.log(data);
        }
      })
      .catch((error) => {
        console.log(error);
        window.parent.postMessage('Error', '*');
        this.getSignature();
      });
  }

  startMeeting() {
    document.getElementById('zmmtg-root').style.display = 'block';
    this.subscription = setInterval(() => {
      console.log('click');
      document.getElementById('join-btn')?.click();
    }, 10);

    ZoomMtg.init({
      leaveUrl: `https://dev-zoom.k8s-cluster-poc-475abba301f29ce035eb2a3d8e891717-0000.eu-de.containers.appdomain.cloud/${
        this.meetingNumber
      }/${this.passWord}/${this.userName}/${1}`,
      success: (success) => {
        console.log(success);
        ZoomMtg.join({
          signature: this.signature,
          meetingNumber: this.meetingNumber,
          userName: this.userName,
          sdkKey: 'XdFZ6asJoChJwirruwmfQR4CoLAEeJzYnq7G',
          userEmail: this.userEmail,
          passWord: this.passWord,
          success: (success) => {},
          error: (error) => {
            window.parent.postMessage(error, '*');
          },
        });
      },

      error: (error) => {
        window.parent.postMessage(error, '*');
        console.log(error);
      },
    });

    ZoomMtg.inMeetingServiceListener('onUserJoin', (data) => {
      console.log(data, 'onUserJoin');
      if (data.isGuest) {
        this.meetingStarted = true;
        window.parent.postMessage('userJoined', '*');
        clearInterval(this.subscription);
      }
      if (data.isHost) {
        window.parent.postMessage('hostJoined', '*');
      }
    });
    ZoomMtg.inMeetingServiceListener('onUserLeave', (data) => {
      console.log(data, 'onUserLeave');
    });

    ZoomMtg.inMeetingServiceListener('onMeetingStatus', (data) => {
      console.log(data, 'onMeetingStatus');
      if (data.meetingStatus == 3 && this.meetingStarted) {
        window.parent.postMessage('Close', '*');
      }
    });
  }
}
