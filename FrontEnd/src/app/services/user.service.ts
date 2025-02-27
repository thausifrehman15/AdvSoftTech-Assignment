import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
interface User {
    id: number;
    name: string;
    email: string;
}

const userDictionary: { [key: number]: User } = {
    1: { id: 1, name: 'John Doe', email: 'john.doe@example.com' },
    2: { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com' },
    3: { id: 3, name: 'Alice Johnson', email: 'alice.johnson@example.com' }
};

export class UserService {
    private apiUrl = 'https://api.example.com/users';

    @Injectable({
        providedIn: 'root'
    })

    login(username: string, password: string) {
        return true
      }
  
  
    getUsers(): Observable<User[]> {
        return new Observable(observer => {
            observer.next(Object.values(userDictionary));
            observer.complete();
        });
    }

    getUserById(id: number): Observable<User> {
        return new Observable(observer => {
            const user = userDictionary[id];
            if (user) {
                observer.next(user);
            } else {
                observer.error(new Error('User not found'));
            }
            observer.complete();
        });
    }

    createUser(user: User): Observable<User> {
        return new Observable(observer => {
            const newId = Object.keys(userDictionary).length + 1;
            user.id = newId;
            userDictionary[newId] = user;
            observer.next(user);
            observer.complete();
        });
    }

    updateUser(id: number, user: User): Observable<User> {
        return new Observable(observer => {
            if (userDictionary[id]) {
                userDictionary[id] = user;
                observer.next(user);
            } else {
                observer.error(new Error('User not found'));
            }
            observer.complete();
        });
    }

    deleteUser(id: number): Observable<void> {
        return new Observable(observer => {
            if (userDictionary[id]) {
                delete userDictionary[id];
                observer.next();
            } else {
                observer.error(new Error('User not found'));
            }
            observer.complete();
        });
    }
}