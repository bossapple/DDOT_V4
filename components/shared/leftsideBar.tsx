"use client";

import { useState, useEffect } from "react";

import CircleIcon from "@mui/icons-material/Circle";
import MenuIcon from "@mui/icons-material/Menu";
import {
  Box,
  Divider,
  Drawer,
  List,
  ListItem,
  Toolbar,
  Typography,
  AppBar,
  IconButton,
  Button,
} from "@mui/material";

import Cookies from "js-cookie";

import { Link } from "@mui/material";

import { ADMIN, AdminRouteType, getDynamicAdmin } from "../../app/constants/admin/admin";
import { DOCTOR, DoctorRouteType, getDynamicDoctor } from "../../app/constants/doctor/doctor"
import { OBSERVER, ObserverRouteType, getDynamicObserver } from "@/app/constants/observer/observer";

// import Link from 'next/link'
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";


function LeftsideBar({ role }: { role: string }) {
  const pathName = usePathname();
  const router = useRouter()

  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminDynamicRoutes, setAdminDynamicRoute] = useState<AdminRouteType[]>(ADMIN)
  const [observerDynamicRoute, setObserverDynamicRoute] = useState<ObserverRouteType[]>(OBSERVER)
  const [doctorDynamicRoute, setDoctorDynamicRoute] = useState<DoctorRouteType[]>(DOCTOR)

  useEffect(() => {
    const matches = pathName.match(/\/Admin\/([^/]+)\//);
    const cidParam = matches && matches[1];

    const updatedAdmin = getDynamicAdmin(cidParam as string)
    setAdminDynamicRoute(updatedAdmin)
  }, [pathName, role])

  useEffect(() => {
    const mathces = pathName.match(/\/Obs\/([^/]+)\//);
    const cidParam = mathces && mathces[1]

    const updatedObserver = getDynamicObserver(cidParam as string)
    setObserverDynamicRoute(updatedObserver)
  }, [pathName, role])

  useEffect(() => {
    const mathces = pathName.match(/\/Doc\/([^/]+)\//);
    const cidParam = mathces && mathces[1]

    const updatedDoctor = getDynamicDoctor(cidParam as string)
    setDoctorDynamicRoute(updatedDoctor)
  }, [pathName, role])

  const handleMobileOpen = () => {
    setMobileOpen(!mobileOpen);
  };

  function removeUserCookies() {
    Cookies.remove('user', { path: '/' })
    router.push('/')
  }

  const drawer =
    role === "ADMIN" ? (
      <Box
        sx={{ backgroundColor: "#F4F5FA", height: "100%", minWidth: "255px" }}
      >
        <Toolbar>
          <CircleIcon />
          <Typography ml={2} variant="h6" sx={{ textAlign: "center" }}>
            D-DOT 2024 <br />
            ADMIN
          </Typography>
        </Toolbar>
        <Divider />
        <List sx={{ paddingRight: "12px" }}>
          {adminDynamicRoutes.map((link, index) => {
            const isActive =
              (pathName.includes(link.route) && link.route.length > 1) ||
              pathName === link.route;
            return (
              <ListItem
                key={link.label}
                sx={{
                  marginTop: "12px",
                  display: "flex",
                  background: isActive
                    ? `linear-gradient(90deg, #31A3FA 0%, #264CC8 100%)`
                    : "inherits",
                  borderTopRightRadius: `${isActive && "50px"}`,
                  borderBottomRightRadius: `${isActive && "50px"}`,
                }}
              >
                <Link
                  href={link.route}
                  key={link.label}
                  sx={{
                    display: "flex",
                    textDecoration: "none",
                    color: "#656B73",
                  }}
                >
                  <Image
                    src={`${isActive ? link.imgClickURL : link.imgURL}`}
                    alt={link.label}
                    width={24}
                    height={24}
                    style={{ color: `${isActive && "#fff"}` }}
                  />
                  <Typography
                    sx={{
                      marginLeft: "16px",
                      color: `${isActive && "#fff"}`,
                    }}
                  >
                    {link.label}
                  </Typography>
                </Link>
              </ListItem>
            );
          })}
          <Button onClick={removeUserCookies} sx={{ paddingLeft: "16px", marginTop: '12px' }}>
            <Image
              src='/images/log-out-icon.svg'
              width={24}
              height={24}
              alt='ออกจากระบบ'
            />
            <Typography sx={{ marginLeft: '16px', color: '#656B73' }}>
              ออกจากระบบ
            </Typography>
          </Button>
        </List>
      </Box>
    ) : (
      role === 'OBSERVER' ? (
        <Box
          sx={{ backgroundColor: "#F4F5FA", height: "100%", minWidth: "255px" }}
        >
          <Toolbar>
            <CircleIcon />
            <Typography ml={2} variant="h6" sx={{ textAlign: "center" }}>
              D-DOT 2024 <br />
              OBSERVER
            </Typography>
          </Toolbar>
          <Divider />
          <List sx={{ paddingRight: "12px" }}>
            {observerDynamicRoute.map((link, index) => {
              const isActive =
                (pathName.includes(link.route) && link.route.length > 1) ||
                pathName === link.route;
              return (
                <ListItem
                  key={link.label}
                  sx={{
                    marginTop: "12px",
                    display: "flex",
                    background: isActive
                      ? `linear-gradient(90deg, #31A3FA 0%, #264CC8 100%)`
                      : "inherits",
                    borderTopRightRadius: `${isActive && "50px"}`,
                    borderBottomRightRadius: `${isActive && "50px"}`,
                  }}
                >
                  <Link
                    href={link.route}
                    key={link.label}
                    sx={{
                      display: "flex",
                      textDecoration: "none",
                      color: "#656B73",
                    }}
                  >
                    <Image
                      src={`${isActive ? link.imgClickURL : link.imgURL}`}
                      alt={link.label}
                      width={24}
                      height={24}
                      style={{ color: `${isActive && "#fff"}` }}
                    />
                    <Typography
                      sx={{
                        marginLeft: "16px",
                        color: `${isActive && "#fff"}`,
                      }}
                    >
                      {link.label}
                    </Typography>
                  </Link>
                </ListItem>
              );
            })}
            <Button onClick={removeUserCookies} sx={{ paddingLeft: "16px", marginTop: '12px' }}>
              <Image
                src='/images/log-out-icon.svg'
                width={24}
                height={24}
                alt='ออกจากระบบ'
              />
              <Typography sx={{ marginLeft: '16px', color: '#656B73' }}>
                ออกจากระบบ
              </Typography>
            </Button>
          </List>
        </Box>
      ) : (
        <Box
          sx={{ backgroundColor: "#F4F5FA", height: "100%", minWidth: "255px" }}
        >
          <Toolbar>
            <CircleIcon />
            <Typography ml={2} variant="h6" sx={{ textAlign: "center" }}>
              D-DOT 2024 <br/>
              Doctor
            </Typography>
          </Toolbar>
          <Divider />
          <List sx={{ paddingRight: "12px" }}>
            {doctorDynamicRoute.map((link, index) => {
              const isActive =
                (pathName.includes(link.route) && link.route.length > 1) ||
                pathName === link.route;
              return (
                <ListItem
                  key={link.label}
                  sx={{
                    marginTop: "12px",
                    display: "flex",
                    background: isActive
                      ? `linear-gradient(90deg, #31A3FA 0%, #264CC8 100%)`
                      : "inherits",
                    borderTopRightRadius: `${isActive && "50px"}`,
                    borderBottomRightRadius: `${isActive && "50px"}`,
                  }}
                >
                  <Link
                    href={link.route}
                    key={link.label}
                    sx={{
                      display: "flex",
                      textDecoration: "none",
                      color: "#656B73",
                    }}
                  >
                    <Image
                      src={`${isActive ? link.imgClickURL : link.imgURL}`}
                      alt={link.label}
                      width={24}
                      height={24}
                      style={{ color: `${isActive && "#fff"}` }}
                    />
                    <Typography
                      sx={{
                        marginLeft: "16px",
                        color: `${isActive && "#fff"}`,
                      }}
                    >
                      {link.label}
                    </Typography>
                  </Link>
                </ListItem>
              );
            })}
            <Button onClick={removeUserCookies} sx={{ paddingLeft: "16px", marginTop: '12px' }}>
              <Image
                src='/images/log-out-icon.svg'
                width={24}
                height={24}
                alt='ออกจากระบบ'
              />
              <Typography sx={{ marginLeft: '16px', color: '#656B73' }}>
                ออกจากระบบ
              </Typography>
            </Button>
          </List>
        </Box>
      )
    );

  return (
    <Box>
      <IconButton
        color="inherit"
        edge="start"
        onClick={handleMobileOpen}
        sx={{
          display: { sm: "block", lg: "none" },
          padding: "20px",
          ml: 2,
          mt: 2,
        }}
      >
        <MenuIcon />
      </IconButton>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleMobileOpen}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { md: "none", sm: "block", xs: "block" },
          width: 235,
        }}
      >
        {drawer}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { md: "block", sm: "none", xs: "none" },
          width: 235,
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
}

export default LeftsideBar;
