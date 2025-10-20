import { DebugElement } from '@angular/core';
import { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

export class TestHelpers {
  static clickElement(fixture: ComponentFixture<any>, selector: string): void {
    const element = fixture.debugElement.query(By.css(selector));
    if (element) {
      element.nativeElement.click();
      fixture.detectChanges();
    }
  }

  static getElementText(fixture: ComponentFixture<any>, selector: string): string {
    const element = fixture.debugElement.query(By.css(selector));
    return element ? element.nativeElement.textContent.trim() : '';
  }

  static getElement(fixture: ComponentFixture<any>, selector: string): DebugElement | null {
    return fixture.debugElement.query(By.css(selector));
  }

  static getAllElements(fixture: ComponentFixture<any>, selector: string): DebugElement[] {
    return fixture.debugElement.queryAll(By.css(selector));
  }

  static hasClass(fixture: ComponentFixture<any>, selector: string, className: string): boolean {
    const element = fixture.debugElement.query(By.css(selector));
    return element ? element.nativeElement.classList.contains(className) : false;
  }
}
