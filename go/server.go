package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/julienschmidt/httprouter"
)

type timestampStore struct {
	Unix int64  `json:"unix"`
	Utc  string `json:"utc"`
}

type requestError struct {
	Error string `json:"error"`
}

type userInfo struct {
	Ipaddress string `json:"ipaddress"`
	Language  string `json:"language"`
	Software  string `json:"software"`
}

func main() {
	router := httprouter.New()

	router.GET("/api/timestamp", getTimestamp)
	router.GET("/api/timestamp/:timestamp", getTimestamp)
	router.GET("/api/whoami", whoAmI)

	if err := http.ListenAndServe(":8080", router); err != nil {
		fmt.Println(err)
	}
}

func getTimestamp(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	URLTimestamp := ps.ByName("timestamp")

	log.Print(URLTimestamp)

	if URLTimestamp == "" {
		if err := json.NewEncoder(w).Encode(generateTimestampStore(time.Now())); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	} else {
		if parsedURLTimestamp, err := time.Parse("2006-1-2", URLTimestamp); err == nil {
			if err := json.NewEncoder(w).Encode(generateTimestampStore(parsedURLTimestamp)); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
			}
		} else if i, err := strconv.ParseInt(URLTimestamp, 10, 64); err == nil {
			parsedURLTimestamp := time.Unix(i, 0)

			if err := json.NewEncoder(w).Encode(generateTimestampStore(parsedURLTimestamp)); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
			}
		} else {
			if err := json.NewEncoder(w).Encode(requestError{"Invalid Date"}); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
			}
		}
	}
}

func generateTimestampStore(timestamp time.Time) timestampStore {
	return timestampStore{
		timestamp.Unix(),
		timestamp.Format(http.TimeFormat),
	}
}

func whoAmI(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	ipAddress := r.Header.Get("X-Forwarded-For")

	if ipAddress == "" {
		ipAddress = r.RemoteAddr
	}

	UserInfo := userInfo{
		ipAddress,
		r.Header.Get("Accept-Language"),
		r.Header.Get("User-Agent"),
	}

	if err := json.NewEncoder(w).Encode(UserInfo); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
