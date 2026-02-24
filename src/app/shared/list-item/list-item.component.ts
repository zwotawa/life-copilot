import { Component, OnInit, Input } from '@angular/core';
import { InboxItem } from 'src/app/core/inbox.model';

@Component({
  selector: 'app-list-item',
  templateUrl: './list-item.component.html',
  styleUrls: ['./list-item.component.scss']
})
export class ListItemComponent implements OnInit {

  @Input() itemData?: InboxItem;


  constructor() { }

  ngOnInit(): void {
  }

}
