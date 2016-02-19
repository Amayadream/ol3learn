package com.amayadream.ol3learn.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * @author :  Amayadream
 * @date :  2016.02.19 16:31
 */
@Controller
@RequestMapping(value = "")
public class RouteController {

    @RequestMapping(value = "map")
    public String map(){
        return "apps/map";
    }
}
