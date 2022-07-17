import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  EventEmitter,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ZoomMtg } from '@zoomus/websdk';
import ZoomMtgEmbedded from '@zoomus/websdk/embedded';
import { interval, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';

ZoomMtg.setZoomJSLib('https://source.zoom.us/2.4.5/lib', '/av');

@Component({
  selector: 'app-zoom-wrapper',
  templateUrl: './zoom-wrapper.component.html',
  styleUrls: ['./zoom-wrapper.component.scss'],
})
export class ZoomWrapperComponent implements OnInit, OnDestroy {
  signatureEndpoint = 'https://eshtri-aqar.herokuapp.com';
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
  constructor(
    public httpClient: HttpClient,
    @Inject(DOCUMENT) document: any,
    private router: ActivatedRoute
  ) {}
  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  ngOnInit(): void {
    this.router.params.subscribe((res: any) => {
      this.meetingNumber = res.id;
      this.passWord = res.pwd;
    });
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
                width: 480,
                height: 300,
              },
              ribbon: {
                width: 400,
                height: 300,
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
      .then(() => this.getSignature());
  }
  getSignature() {
    this.hasMeeting = true;
    this.loading = true;
    setTimeout(() => {
      this.loading = false;
    }, 1800);
    this.httpClient
      .post(this.signatureEndpoint, {
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
        this.loading = false;
        this.hasMeeting = false;
      });
  }

  startMeeting(signature: any) {
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
        this.meetingStarted = true;
        this.subscription = interval(1).subscribe((x) => {
          if (
            document.getElementsByClassName(
              'zmwebsdk-makeStyles-videoCustomize-1'
            ).length == 0
          ) {
            this.meetingStarted = false;
            this.hasMeeting = false;
            this.joinedMeeting.emit('joined');
          } else {
            let popup = document.getElementsByClassName(
              'zmwebsdk-makeStyles-paper-53'
            )[0];
            let parent = popup?.parentNode;
            if (parent?.parentElement.lastElementChild.classList.length == 0)
              parent?.parentElement.lastElementChild.classList.toggle('test');
            let popup2 = document.getElementsByClassName(
              '.zmwebsdk-makeStyles-paper-67'
            )[0];
            let parent2 = popup2?.parentNode;
            if (parent2?.parentElement.lastElementChild.classList.length == 0)
              parent2?.parentElement.lastElementChild.classList.toggle('test');
            this.meetingStarted = true;
            this.hasMeeting = true;
          }
        });
      })
      .catch((err) => {
        console.log(err);
        if (err.errorCode && err.errorCode != 3707 && err.errorCode != -3000) {
          this.meetingStarted = true;
          this.hasMeeting = true;
          // this.subscription = interval(1000).subscribe((x) => {
          //   if (document.getElementsByClassName("zmwebsdk-makeStyles-videoCustomize-1").length == 0) {
          //     this.meetingStarted = false;
          //     this.hasMeeting = false;
          //     this.joinedMeeting.emit("joined");
          //   } else {
          //     this.meetingStarted = true;
          //     this.hasMeeting = true;
          //   }
          // });
        } else {
          this.meetingStarted = false;
          this.hasMeeting = false;
        }
      });
  }
}
