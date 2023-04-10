import { HttpClient } from '@angular/common/http';
import { AfterViewChecked, ChangeDetectorRef, Component, OnInit } from '@angular/core';

declare var $: any;

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, AfterViewChecked {

  constructor(private http: HttpClient, private cd: ChangeDetectorRef) { }

  messages: any = [];
  total: number = 0;
  pageNo: number = 1;
  limit: number = 20;
  messagesSection: any;
  loaded = false;
  loadingEle: HTMLElement | undefined;
  scrollTopEle: any;

  ngAfterViewChecked(): void {
    if (this.scrollTopEle) {
      const offsetTop = $(this.scrollTopEle)[0].offsetTop;
      $('.messagesSection').animate({
        scrollTop: offsetTop
      }, 0);
    }
  }

  ngOnInit(): void {
    this.getComments()
    this.messagesSection = document.querySelector(".messagesSection");

    $('.messagesSection').on('scroll', (e: any) => {
      if (e.currentTarget.scrollTop <= 20 && this.loaded && this.total > this.messages.length) {
        // this.messagesSection.scrollTop = 40;
        // this.cd.detectChanges();
        this.scrollTopEle = '#message_' + this.messages[1].id;
        console.log(this.scrollTopEle);
        this.setScrollPositionOnRetrive();
        this.loadingEle = document.createElement('div');
        this.loadingEle.classList.add('loading');
        this.loadingEle.innerText = 'Loading...'
        this.messagesSection.append(this.loadingEle);
        this.pageNo += 20;
        this.getComments();
      }
    });
  }

  public getComments() {
    this.loaded = false;
    this.http.get(`https://dummyjson.com/products?skip=${this.pageNo}&limit=${this.limit}`).subscribe((res: any) => {
      this.loaded = true;
      this.total = res.total;
      if (this.messages.length != 0) {
        this.messages = [...res.products.reverse(), ... this.messages];
      } else {
        this.messages = res.products.reverse();
      }
      console.log(this.messages);
      this.cd.detectChanges();
      this.loadingEle?.remove();
      this.scrollTopEle = null;
      if (this.pageNo == 1) {
        setTimeout(() => {
          this.messagesSection.scrollTop = this.messagesSection.scrollHeight;
        });
      }
    });
  }

  public setScrollPositionOnRetrive() {

  }

}
