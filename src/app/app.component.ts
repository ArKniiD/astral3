import { Component } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'three-angular';
  bloom = false;

  toggleBloom: Subject<boolean> = new BehaviorSubject(this.bloom);

  onToogleBloom() {
    console.log('test');
    this.bloom = !this.bloom;
    this.toggleBloom.next(this.bloom);
  }

}
