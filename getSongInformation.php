<?php
$info_url = $_GET["url"];
$info_str = file_get_contents(rawurldecode($info_url));
echo $info_str;
?>
