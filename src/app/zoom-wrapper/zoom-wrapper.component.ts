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
  leaveUrl = '';
  loading = false;
  isEnd = 0;
  subscription: Subscription;
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
      this.isEnd = res.end;
      if (this.isEnd == 1) {
        console.log('test');
        document.body.style.backgroundColor = 'transparent';
        window.parent.postMessage('Close', '*');
      } else {
        this.meetingNumber = res.id;
        this.passWord = res.pwd;
        this.userName = res.name;
        this.getSignature();
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
          this.startMeeting();
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

  startMeeting() {
    document.getElementById('zmmtg-root').style.display = 'block';
    ZoomMtg.init({
      leaveUrl: `${environment.zoomUrl}${this.meetingNumber}/${this.passWord}/${
        this.userName
      }/${1}`,
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
            window.parent.postMessage('Start', '*');
            this.meetingStarted = true;
            console.log(success);
          },
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
  }
}
