import dynamic from "next/dynamic";
import Image from "next/image";
import React, { Fragment } from "react";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import classes from "./main-navigation.module.css";

const MenuDropdown = dynamic(() => import("../ui/menu-dropdown"), {});
const Breadcrumb = dynamic(() => import("./breadcrumb"), {});

const pages = [{ label: "Notebooks", link: "/notebooks" }];

const MainNavigation = () => {
	return (
		<Fragment>
			<div className={classes.header} id="header_height">
				<div className={classes.header_container}>
					<div className={classes.logo_container}>
						<div className={classes.header_title_logo}>
							<Image
								src="/images/edit_white.png"
								alt="Notes logo"
								width={20}
								height={20}
							/>
						</div>
						<div className={classes.header_title}>Notes</div>
					</div>
					<div className={classes.header_toolbar}>
						<Toolbar>
							<Box sx={{ flexGrow: 0 }}>
								<MenuDropdown />
							</Box>
						</Toolbar>
					</div>
				</div>
			</div>
			<Breadcrumb />
		</Fragment>
	);
};

export default MainNavigation;
