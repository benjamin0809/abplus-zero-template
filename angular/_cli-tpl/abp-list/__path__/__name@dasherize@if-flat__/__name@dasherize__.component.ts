import { Component, Injector, ViewChild<% if(!!viewEncapsulation) { %>, ViewEncapsulation<% }%><% if(changeDetection !== 'Default') { %>, ChangeDetectionStrategy<% }%> } from '@angular/core';
import { ModalHelper } from '@delon/theme';
import { STColumn, STComponent, STChange } from '@delon/abc';
import { SFSchema } from '@delon/form';
import { Moment } from 'moment';
import * as moment from 'moment';
import * as _ from 'lodash';
import { finalize } from 'rxjs/operators';
import { PagedRequestDto, PagedListingComponentBase } from '@shared/component-base/paged-listing-component-base';
import { PagedResultDtoOf<%= EntityName %>Dto
  , <%= EntityName %>ServiceProxy, <%= EntityName %>Dto } from '@shared/service-proxies/service-proxies';
import { <%= componentName.replace('Component','') %>CreateComponent } from './create/create.component';
import { <%= componentName.replace('Component','') %>EditComponent } from './edit/edit.component';
  
class Paged<%= EntityName %>RequestDto extends PagedRequestDto {
  <% for (let i = 0; i < requestList.length; i++) {
    const element = requestList[i];
    var type = element.type;
    switch (element.type) {
      case 'boolean':
        type = 'boolean | null';
        break;
      case 'string':
        type = element.format === 'date-time' ? 'Moment | null' : element.type;
        break;
      default:
        break;
    }
    if (element.name === 'SkipCount' || element.name === 'MaxResultCount') {
      continue;
    }
  %><%= camelize(element.name) %>:<%= type %>;
  <% } %>
}

@Component({
  selector: '<%= selector %>',
  templateUrl: './<%= dasherize(name) %>.component.html',<% if(!inlineStyle) { %><% } else { %>
  styleUrls: ['./<%= dasherize(name) %>.component.<%= styleext %>']<% } %><% if(!!viewEncapsulation) { %>,
  encapsulation: ViewEncapsulation.<%= viewEncapsulation %><% } if (changeDetection !== 'Default') { %>,
  changeDetection: ChangeDetectionStrategy.<%= changeDetection %><% } %>
})
export class <%= componentName %> extends PagedListingComponentBase<<%= EntityName %>Dto> {
  items: any[]; // 赋[]会导致init时没有loading效果
    <% if (SFDtoSchema) { %>searchSchema: SFSchema = {
properties:{
  <% for (const key in SFDtoSchema.properties) {
    const sfProp=SFDtoSchema.properties[key];
    %><%= camelize(key)%>:<%=JSON.stringify(sfProp,null,4).replace(/"/g, '\'')%>,
  <% } %>
}
  };<% } else { %>
    searchSchema: SFSchema = {
      properties: {
        keyword: {
          type: 'string',
          title: '关键字'
        },
        isActive: {
          type: 'string',
          title: '是否启用',
          enum: [
            { label: '全部', value: '' },
            { label: '是', value: 'true' },
            { label: '否', value: 'false' }
          ],
          default: '',
          ui: {
            widget: 'select'
          }
        },
        from: {
          title: this.l('CreationTime'),
          type: 'string',
          format: 'date-time',
          ui: { widget: 'date', end: 'to' }
        },
        to: {
          format: 'date-time',
          type: 'string'
        }
      }
    };
  <% } %>
  <% if (STDtoTpl) { %>
   columns: STColumn[] = <%= STDtoTpl %>;
  // Actions Column
  // {
  //   title: this.l('Actions'),
  //   buttons: [
  //     // { text: '查看', click: (item: any) => `/form/${item.id}` },
  //     {
  //       text: '编辑',
  //       type: 'static',
  //       component: <%= componentName.replace('Component','') %>EditComponent,
  //       params: (item: any) => ({ record: item }),
  //       click: (r, m, i) => this.refresh()
  //     },
  //     {
  //        text: '删除',
  //        pop: true,
  //        popTitle: '确定删除？',
  //        click: (item: any) => {
  //          this.delete(item);
  //          this.refresh();
  //        }
  //      }
  //   ]
  // }
  <% } else { %>columns: STColumn[] = [
      { title: '用户名', index: 'userName' },
      { title: '全名', index: 'fullName' }, // this.l('pages.setting.<%= name %>.list.fullName')
      { title: '名字', index: 'name' },
      { title: '是否启用',
        index: 'isActive',
        type: 'badge',
        badge: { true: { text: '已启用', color: 'success' }, false: { text: '未启用', color: 'default' } }
      },
      { title: '创建时间', type: 'date', index: 'creationTime' },
      {
        title: this.l('Actions'),
        buttons: [
          // { text: '查看', click: (item: any) => `/form/${item.id}` },
          {
            text: '编辑',
            type: 'static',
            component: <%= componentName %>EditComponent,
            params: (item: any) => ({ record: item }),
            click: (r, m, i) => this.refresh()
          },
        ]
      }
    ];<% } %>

  constructor(
    private injector: Injector,
    private <%= camelize(EntityName) %>Service: <%= EntityName %>ServiceProxy,
    private modal: ModalHelper,
    ) {
    super(injector);
  }

  add() {
    this.modal
      .createStatic( <%= componentName.replace('Component','') %>CreateComponent)
      .subscribe(() => this.refresh()); // this.st.reload()无法刷新数据，因为是通过属性绑定的，不是st自己请求的
  }
  
  protected list(
    request: Paged<%= EntityName %>RequestDto,
    pageNumber: number,
    finishedCallback: Function
  ): void {

    _.merge(request, this.filter);

    if (this.filter && this.filter.from) {
      request.from = moment(this.filter.from);
    }
    if (this.filter && this.filter.to) {
      request.to = moment(this.filter.to);
    }

    this.<%= camelize(EntityName) %>Service
      .<%=camelize(requestMethodName)%>(<% for (let index = 0; index < requestList.length; index++) {
        const para = requestList[index];
        %>request.<%=camelize(para.name)%>,<% } %>)
      .pipe(
        finalize(() => {
          finishedCallback();
        })
      )
      .subscribe((result: PagedResultDtoOf<%= EntityName %>Dto) => {
        this.items = result.items;
        this.showPaging(result, pageNumber);
      });
  }
  protected delete(entity:  <%= EntityName %>Dto): void {
    this.<%= camelize(EntityName) %>Service.delete(entity.id).subscribe(() => this.refresh());
  }
}
