import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  EventEmitter,
  Inject,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { ZoomMtg } from '@zoomus/websdk';
import ZoomMtgEmbedded from '@zoomus/websdk/embedded';
import { interval, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
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
  @Output() joinedMeeting: EventEmitter<any> = new EventEmitter<any>();
  hasMeeting = false;
  meetingSDKElement: HTMLElement;
  client = ZoomMtgEmbedded.createClient();
  signature = '';
  meetingStarted = false;
  leaveUrl = 'https://eshtriaqar.com.eg/';
  loading = false;
  subscription: Subscription;
  isFullScreen = 0;
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
      this.isFullScreen = res.fullScreen;
      this.userName = res.name;
      if (this.isFullScreen == 1) {
        this.getSignature();
      } else {
        this.meetingSDKElement = document.getElementById('meetingSDKElement');
        this.client
          .init({
            debug: true,

            zoomAppRoot: this.meetingSDKElement,
            language: 'en-US',
            customize: {
              video: {
                isResizable: true,

                viewSizes: {
                  default: {
                    width: window.screen.width * 0.75,
                    height: window.screen.height * 0.5,
                  },
                  ribbon: {
                    width: window.screen.width * 0.3,
                    height: window.screen.height * 0.35,
                  },
                },
              },
              meetingInfo: [
                'topic',
                'host',
                'mn',
                'pwd',
                'telPwd',
                'invite',
                'participant',
                'dc',
                'enctype',
              ],
            },
          })
          .then(() => this.getSignature())
          .catch((err) => {
            console.log(err);
          });
      }
    });
  }
  getSignature() {
    this.hasMeeting = true;
    console.log('start');
    window.parent.postMessage('Open', '*');
    this.httpClient
      .post(environment.baseUrl, {
        meetingNumber: this.meetingNumber,
        role: this.role,
      })
      .pipe(
        tap(() => {
          this.loading = false;
        })
      )
      .toPromise()
      .then((data: any) => {
        console.log(data);
        this.loading = false;
        if (data.signature) {
          this.loading = false;
          this.signature = data.signature;
          this.startMeeting(data.signature);
        } else {
          console.log(data);
          this.loading = false;
          this.hasMeeting = false;
        }
      })
      .catch((error) => {
        console.log(error);
        window.parent.postMessage('Error', '*');
        this.loading = false;
        this.hasMeeting = false;
      });
  }

  startMeeting(signature: any) {
    if (this.isFullScreen == 1) {
      document.getElementById('zmmtg-root').style.display = 'block';
      ZoomMtg.init({
        leaveUrl: this.leaveUrl,
        isSupportAV: true,
        success: (success) => {
          console.log(success);
          ZoomMtg.join({
            signature: this.signature,
            meetingNumber: this.meetingNumber,
            userName: this.userName,
            sdkKey: 'XdFZ6asJoChJwirruwmfQR4CoLAEeJzYnq7G',
            userEmail: this.userEmail,
            passWord: this.passWord,
            success: (success) => {
              console.log(success);
            },
            error: (error) => {
              console.log(error);
            },
          });
        },
        error: (error) => {
          console.log(error);
        },
      });
    } else {
      this.hasMeeting = true;
      this.client
        .join({
          sdkKey: 'XdFZ6asJoChJwirruwmfQR4CoLAEeJzYnq7G',
          signature: signature,
          meetingNumber: this.meetingNumber,
          password: this.passWord,
          userName: this.userName,
          userEmail: this.userEmail,
        })
        .then((res) => {
          window.parent.postMessage('Start', '*');
          this.meetingStarted = true;
          this.subscription = interval(100).subscribe((x) => {
            if (
              document.getElementsByClassName('react-draggable').length == 0
            ) {
              window.parent.postMessage('Close', '*');
            }
          });
        })
        .catch((err) => {
          window.parent.postMessage(err, '*');
          this.subscription = interval(100).subscribe((x) => {
            if (
              document.getElementsByClassName('react-draggable').length == 0
            ) {
              window.parent.postMessage('Close', '*');
            }
          });
          if (
            err.errorCode &&
            err.errorCode != 3707 &&
            err.errorCode != -3000
          ) {
            window.parent.postMessage('Start', '*');
            this.meetingStarted = true;
            this.hasMeeting = true;
          } else {
            this.meetingStarted = false;
            this.hasMeeting = false;
          }
        });
    }
  }
}
